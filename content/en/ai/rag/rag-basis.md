---
title: "RAG Core Concepts: Retrieval, Generation, and Engineering Trade-offs"
description: "Introduces the working principles of RAG (Retrieval-Augmented Generation), Embedding, similarity metrics, and the applicable scenarios and limitations of RAG compared to search, fine-tuning, and long context windows."
category: AI Application Development
head:
  - - meta
    - name: keywords
      content: RAG,Retrieval-Augmented Generation,LLM,knowledge base,Embedding,semantic search,vector search,fine-tuning,Fine-tuning,long context,enterprise knowledge base
lang: en
sourceRef: zh-ref/ai/rag/rag-basis.md
---

When building enterprise knowledge base Q&A systems, many teams initially attempt to feed documents directly into the large language model's context. When there are only a few documents, this approach certainly works. However, once the knowledge base expands to hundreds of thousands or even millions of words, a single request quickly hits the Token limit or drives up Time-To-First-Token (TTFT) latency. Enterprise environments must also address document updates, permission isolation, citation tracing, and API costs, making it infeasible to rely on brute-force full-context stuffing for routine queries.

RAG retrieves relevant passages from the knowledge base before the model generates a response, placing only those passages into the context. This anchors the response on verifiable evidence. If errors occur in any stage—retrieval, context assembly, or generation—the final answer can deviate from the source text.

## What Is RAG?

**RAG (Retrieval-Augmented Generation)** combines information retrieval with large language model generation. The system first retrieves passages relevant to the current question from databases, document collections, or internal enterprise systems. It then packages these passages together with the original question into a Prompt and supplies it to the LLM. This enables the model to generate an answer grounded in the retrieved materials, rather than relying exclusively on the knowledge memorized in its pre-trained parameters.

![RAG Diagram](/media/jg/ext/oss.javaguide.cn/javaguide/ai/rag/rag-index-and-retrieval-explainer-f0a3c091.webp)

## Why Is RAG Needed?

![How RAG (Retrieval-Augmented Generation) Solves Core LLM Challenges](/media/jg/ext/oss.javaguide.cn/javaguide/ai/rag/rag-llm-challenges-7b760a3f.png)

Calling a pre-trained LLM directly for enterprise Q&A typically runs into three major bottlenecks:

1. **Knowledge Timeliness Is Constrained**: The knowledge of a pre-trained model is frozen at its training data cutoff date. The model itself has no awareness of new policies, updated product manuals, or real-time business data released after training. This information must be injected dynamically via external retrieval or tool calling.
2. **Private Data Cannot Be Used Directly**: Internal enterprise product documentation, organizational policies, and customer data cannot simply be fed into the training set of a public foundation model. With RAG, only relevant fragments are extracted and injected into the context based on user permissions at query time. This allows the system to utilize internal enterprise knowledge to answer questions without needing model retraining.
3. **Factual Hallucinations Are Difficult to Verify**: When lacking factual evidence, an LLM may still generate plausible-sounding but erroneous conclusions. By supplying reference source text, RAG prompts the model to answer based on provided evidence and append source citations, significantly reducing the probability of unsubstantiated fabrication. However, RAG cannot eliminate hallucinations entirely. Omissions during retrieval, context noise, mismatched citations, or model failure to follow instructions can still lead to incorrect answers. Production environments generally require citation verification, refusal-to-answer mechanisms, and evaluation feedback loops.

## What Are Common Use Cases for RAG?

RAG is well-suited for scenarios where answers depend on external documentation, where materials are voluminous, or where information updates frequently. Common real-world applications include:

- Customer service and post-sales support: Guiding troubleshooting and workflows based on product manuals, such as querying return/exchange policies or handling equipment error codes.
- R&D and DevOps assistants: Retrieving code repositories, API documentation, runbooks, and historical incident tickets to assist in troubleshooting outages and writing fix proposals.
- Medical and clinical assistance: Searching clinical practice guidelines, drug package inserts, and hospital standards to explain diagnostic indicators or contraindications for physician review.
- Legal and compliance retrieval: Searching statutory provisions, judicial precedents, and contract templates to assist with clause comparisons and risk alerts.
- Enterprise internal knowledge assistants: Connecting HR and finance policies, SOPs, meeting minutes, and technical designs to support cross-document Q&A, summarization, and comparison.

## Why Do Some Enterprises Still Prefer Traditional Search Over RAG?

Many enterprises retain traditional search boxes because a large volume of daily requirements only involves locating the document itself, without needing a model to read it and synthesize a conclusion.

If a user merely wants to download the original text of a policy, look up an API definition, or find a contract template, entering keywords to get a list of documents is actually more straightforward—the pipeline is short, costs are low, and results are highly predictable. In RAG, after retrieval, the system must assemble context and invoke an LLM to generate an answer. Passing through model generation inevitably introduces first-token latency, Token costs, and the risk of summarization bias.

Choosing between traditional search and RAG depends on whether the user's objective is to locate raw materials or to synthesize multiple sources into a conclusion.

| Dimension | Traditional Search (Search Box) | RAG (Retrieval + Generation) |
| --- | --- | --- |
| User Goal | Find documents, pages, attachments | Directly obtain a readable answer, summary, or comparative conclusion |
| Latency & Cost | Typically very low, easy to scale | Higher; requires retrieval plus LLM inference |
| Controllability / Auditability | High; directly provides source links | Lower; prone to misunderstandings or summarization bias; requires citations and evaluation |
| Risk | Low; mainly recall and ranking issues | Higher; includes hallucinations, citation errors, unauthorized data leaks |
| Data Governance | Relatively mature; ACL and field filtering are straightforward | More complex; requires retrieval filtering, context masking, log governance |
| Applicable Scenarios | Lookup by ID, title, keywords; finding templates or policy texts | Customer service Q&A, technical troubleshooting, policy interpretation, cross-document comparison |
| Best Practices | ES / BM25 + permission filtering | Hybrid search + Reranking + citation tracing + permission filtering + evaluation loop |

In actual deployments, many enterprises maintain both entry points concurrently: simple lookups route to search, while complex inquiries route to RAG, balancing response speed with conversational experience.

## How Does RAG Work?

The engineering pipeline of RAG is split into two phases: offline indexing and online retrieval-generation. The offline phase transforms raw documents into searchable data structures; the online phase handles query comprehension, retrieval recall, context building, and answer generation when a user asks a question.

![Simplified Flowchart of Indexing and Retrieval Stages](/media/jg/ext/oss.javaguide.cn/javaguide/ai/rag/rag-rag-engineering-link-e1988667.png)

The offline indexing phase primarily consists of the following steps:

1. Document ingestion and parsing: Extracting body text, tables, and structural information from PDFs, Word files, web pages, Markdown, or database records.
2. Cleaning and denoising: Removing garbled text, repeating headers/footers, meaningless HTML tags, and other noise.
3. Metadata extraction: Enriching records with fields such as document source, update timestamp, section hierarchy path, tenant ID, and Access Control Lists (ACL) for downstream filtering and citation tracing.
4. Document chunking (Chunking): Dividing long documents into smaller fragments. The granularity of chunking must balance semantic integrity, the embedding model's input token limit, and retrieval precision. Chunks that are too large introduce irrelevant noise, while chunks that are too small sever prerequisite conditions. For specific chunking strategies, see [RAG Document Processing and Chunking Strategies](./rag-document-processing.md).
5. Vectorization (Embedding Generation): Calling an Embedding model to map each text chunk into a high-dimensional dense vector. Common choices include OpenAI's `text-embedding-3-small` / `text-embedding-3-large`, as well as open-source models like BGE and Qwen3-Embedding.
6. Writing to index storage: Storing vectors, raw text chunks, and metadata into storage engines such as Milvus, pgvector, or Elasticsearch / OpenSearch. For index algorithms and selection practices, see [RAG Vector Index Algorithms and Vector Databases](./rag-vector-store.md).

Offline indexing can be triggered via scheduled batch jobs or change events for incremental updates; for scenarios where users upload files temporarily during a conversation, documents can also be parsed online in real time and written to ephemeral indices.

The online retrieval and generation phase typically executes in the following sequence:

1. Query reception and rewriting: Receiving the user's natural language question, performing Query Rewriting, decomposition, or extracting metadata filter conditions if necessary.
2. Query vectorization: Converting the query into a vector using the exact same Embedding model employed during offline indexing.
3. Retrieval and Reranking: Combining metadata filtering, vector similarity search, or keyword hybrid search to retrieve candidate chunks, followed by fine-grained ranking with a Rerank model based on query relevance.
4. Context assembly (Augmentation): Combining the reranked chunks, original query, and system instructions (e.g., answering strictly based on the provided materials, citing sources) into a complete Prompt.
5. Answer generation (Generation): The LLM generates a response based on the context, appending references and source links.

When retrieval performance fluctuates, the bottleneck typically lies in chunking granularity, query rewriting, hybrid search, or reranking. For detailed troubleshooting methodologies, see [RAG Optimization](./rag-optimization.md).

## What Is an Embedding?

An Embedding is the process of mapping text into a high-dimensional dense vector space, with the goal of ensuring that semantically similar texts are placed closer together in that space.

Take these three sentences as an example:

- "How do I apply for a refund?"
- "What is the refund process?"
- "How can I cancel an order and get my money back?"

Although they use completely different wording, their underlying intent is essentially identical. When encoded by an Embedding model, their vectors land in close proximity. Even if the internal document is titled "Merchandise Return and Reimbursement Processing Guide", vector search can bypass the surface lexical divergence and successfully retrieve it.

![Embedding: Mapping Text to Semantic Space](/media/jg/ext/oss.javaguide.cn/javaguide/ai/rag/rag-2-embedding-map-text-to-semantic-space-8815378b.png)

Common Embedding dimensions include 768, 1024, 1536, and 3072. Vector dimensionality is determined by model architecture; one cannot deduce that "higher dimensions always yield better performance" in isolation. Higher dimensions directly increase memory consumption, index build time, and distance calculation overhead. Taking OpenAI as an example, `text-embedding-3-small` outputs 1536 dimensions by default, while `text-embedding-3-large` outputs 3072 dimensions by default; both support Matryoshka Representation Learning (via the `dimensions` parameter) to truncate vectors to lower dimensions.

Common Embedding models fall into two categories: closed-source commercial APIs and open-source self-hostable models:

| Type | Representative Models | Best Suited Scenarios |
| --- | --- | --- |
| Closed-source API | OpenAI `text-embedding-3-small` / `text-embedding-3-large`, Cohere Embed, Jina Embeddings API | Looking for out-of-the-box readiness, strong multilingual support, minimal operational burden |
| Open-source Model | BGE series, Qwen3-Embedding, GTE series, E5 series, Jina Embeddings open-source models | Data cannot leave private network, on-premise deployment required, cost control desired |

When selecting a model, the public MTEB (Massive Text Embedding Benchmark) leaderboard serves as a preliminary screening reference, but final validation must be conducted on your business's proprietary question sets to verify recall rate, latency, and deployment costs. If your corpus contains numerous internal acronyms, proprietary model numbers, or specific error codes, relying solely on generic Embeddings is often inadequate and typically needs to be paired with BM25 keyword search.

## How Is Vector Similarity Calculated?

After text is converted into vectors, the retrieval system uses distance or similarity functions to measure how close a query vector is to document vectors. There are three common metrics:

| Metric | Meaning | Characteristics |
| --- | --- | --- |
| Cosine Similarity | Measures the consistency of the angular direction between two vectors | Insensitive to vector magnitude; most commonly used for text semantic retrieval |
| Inner Product (Dot Product) | Calculates the sum of products of corresponding dimensions | When vectors are L2-normalized, inner product is mathematically and rank-equivalent to cosine similarity, but calculates faster |
| Euclidean Distance (L2 Distance) | Calculates straight-line distance between two points in space | Sensitive to vector magnitude; if vectors are L2-normalized, ranking results are identical to cosine distance |

If asked in an interview why text retrieval commonly uses cosine similarity, you can answer from two perspectives: First, text length variations and word frequency shifts can alter the magnitude of unnormalized vectors, whereas cosine similarity focuses solely on orientation, providing a more robust reflection of semantic direction. Second, most mainstream Embedding models use cosine similarity or normalized inner product as their training objective. In production, the distance metric configured in the vector index must strictly match the metric recommended by the Embedding model; otherwise, recall quality will degrade or index lookups will fail entirely.

## What Is the Difference Between RAG and Traditional Search Engines?

![Differences Between RAG and Traditional Search Engines](/media/jg/ext/oss.javaguide.cn/javaguide/ai/rag/rag-rag-vs-search-engine-3894f696.png)

Both traditional search engines and RAG incorporate a retrieval stage, but their final deliverables differ: traditional search sorts candidate documents by relevance and returns a list of hyperlinks, leaving users to open, read, and compare documents themselves; RAG feeds multiple retrieved passages into an LLM context, performs cross-passage information extraction and synthesis, and directly generates an answer with citations.

The primary differences in engineering implementation are as follows:

1. Retrieval Mechanism: Traditional search centers on inverted indices and keyword matching (such as BM25), though modern search engines also layer on vector recall and ranking models. In contrast, RAG's retrieval layer is designed specifically to "supply high signal-to-noise ratio evidence for the LLM", frequently combining vector search, BM25, metadata filtering, Parent-Child chunk expansion, or graph retrieval.
2. Result Format: Traditional search returns a list of documents or snippets; RAG outputs natural language answers or structured conclusions, accompanied by cited passages for auditing.
3. Latency and Cost: Traditional search typically responds within dozens of milliseconds with minimal marginal cost; RAG introduces LLM inference, where first-token latency is usually on the order of seconds and every request consumes input and output Tokens.

## How to Choose Between RAG and Fine-tuning?

"Why not just fine-tune the model?" is a frequent interview question regarding RAG. Their boundaries of responsibility are clear: RAG solves the problem of the model lacking external or up-to-date knowledge, while Fine-tuning solves the problem of model output style, formatting, or inconsistent instruction following for specific tasks.

Take enterprise policies and regulations Q&A as an analogy: RAG is like an open-book exam—the policy handbook resides in an external vector database, relevant articles are retrieved before answering, and when policies are updated, only the index needs to be updated. Fine-tuning is like closed-book memorization, altering model weights through training. If you rely on fine-tuning to memorize frequently shifting business details, not only are training and evaluation cycles lengthy, but the model can still hallucinate or mix up facts, and it cannot natively cite exact source passages.

| Dimension | RAG | Fine-tuning |
| --- | --- | --- |
| Knowledge Updates | Only requires updating the knowledge base or vector index | Requires rebuilding the dataset, retraining, and re-evaluating the model |
| Data Security | Knowledge remains in external storage; dynamically filtered via user ACL at query time | Patterns and information from training data permeate model parameters, making fine-grained permission isolation difficult |
| Hallucination Control | Can instruct model to answer strictly based on retrieved source text and annotate citations | Model generates from parameters; can still fabricate details without direct source binding |
| Cost Structure | Vector storage costs + retrieval and context Token costs per request | Data cleaning/annotation, training compute, model hosting, and multi-version maintenance costs |
| Applicable Scenarios | Knowledge-intensive Q&A, enterprise knowledge bases, legal/regulatory systems, product manuals, real-time data | Tone/style alignment, structured format outputs, domain terminology comprehension, small-model distillation |
| Primary Risks | Recall omissions, context noise interference, overlooked permission filters | Catastrophic forgetting, training data overfitting, high update and rollback costs when knowledge expires |

In complex vertical domains (such as legal, healthcare, or financial research), the two can be combined: use fine-tuning to familiarize the model with domain terminology, reasoning standards, and fixed output formats, then use RAG to inject real-time business data and traceable source evidence. For most engineering teams, it is recommended to first stabilize the RAG pipeline and evaluation benchmark; only consider fine-tuning once you confirm that the primary pain point stems from model instruction following or domain language style.

## Will Long Context Windows Replace RAG?

No. They have a complementary relationship, and their boundary depends on data volume, query frequency, and governance requirements.

Long context windows (such as 128K to 1M+ Tokens) excel at single-turn, few-document full-reading tasks—such as analyzing an entire corporate annual report PDF, understanding a medium-sized codebase module, or summarizing lengthy meeting transcripts. These tasks require reading the complete text, where chunking and retrieval might miss global context.

However, once applied to enterprise knowledge base scenarios, long context windows confront four hard constraints:

1. **Knowledge Base Volume Far Exceeds Window Limits**: Enterprise documents, historical tickets, and contract archives routinely reach tens or hundreds of millions of Tokens, making it impossible to stuff them entirely into a single request.
2. **Exponentially Amplified Latency and Calling Costs**: Even if a knowledge base has only several hundred thousand Tokens that could theoretically fit into an ultra-long window, sending hundreds of thousands of input Tokens on every routine query (even with Prefix Caching) yields Time-To-First-Token (TTFT) and billing costs far higher than passing a few thousand Tokens of retrieved snippets.
3. **Attention Dilution (Lost in the Middle)**: When large volumes of irrelevant documents are mixed into the context, the model's extraction accuracy for key facts located in the middle degrades noticeably, making it vulnerable to distraction by similar but irrelevant clauses.
4. **Permission Isolation and Audit Tracing**: Enterprise knowledge bases demand strict filtering of visible scope based on tenant, role, and document ACLs, as well as explicit auditing of which document and page an answer cited. RAG's retrieval layer natively handles upfront permission filtering, narrows the scope of evidence, and binds citation metadata.

## What Are the Evolutionary Stages of RAG?

The industry generally divides the architectural evolution of RAG into three stages:

![Evolution Stages of RAG](/media/jg/ext/oss.javaguide.cn/javaguide/ai/rag/rag-2-evolution-stages-0aef48d9.png)

| Stage | Typical Pipeline | Characteristics |
| --- | --- | --- |
| Naive RAG | Document Chunking → Embedding → Top-K Retrieval → LLM Generation | Most basic, easiest to implement; suitable for demos and simple knowledge bases |
| Advanced RAG | Query Rewrite / HyDE → Hybrid Search → Rerank → Context Compression → LLM Generation | Focuses on solving inaccurate recall, context noise, and unstable ranking |
| Modular RAG | Pluggable, composable modules: retriever, reranker, compressor, router, generator | Dynamically routed by business scenario; suitable for production systems and complex Agents |

Naive RAG can quickly validate a prototype, but on complex real-world documents it often suffers from broken document structures during chunking, missed technical terms during recall, and inaccurate Top-K ranking. Advanced RAG adds query rewriting before retrieval, hybrid recall and reranking during retrieval, and context compression after retrieval. Modular RAG goes further by decoupling parsing, routing, retrieval (vector, full-text, SQL, graph), and self-reflection into orchestratable modules, dynamically selecting the pipeline based on query type.

## What Are the Engineering Limitations of RAG?

While RAG provides distinct advantages in knowledge updates, private data isolation, and citation tracing, production deployments must evaluate five engineering trade-offs:

1. **Retrieval Quality Dictates Answer Upper Bound**: If a PDF table is misaligned during parsing, or if critical prerequisites are cut off during chunking, evidence that fails to reach the candidate pool cannot be magically recovered downstream by even the strongest LLM.
2. **Context Noise Can Mislead Generation**: If retrieved snippets contain outdated document versions or rules from similar products, the model can easily assemble conditions from disparate sources into false conclusions.
3. **End-to-End Latency Increases**: A complete request may chain query rewriting, embedding encoding, multi-path recall, Cross-Encoder reranking, and LLM generation. Every hop adds latency, requiring caching, timeouts, and fallback strategies under high-concurrency loads.
4. **Multi-Store Consistency Maintenance Is Complex**: When documents are added, modified, deleted, or permissions change, vector databases, full-text indices, and metadata stores must be updated synchronously. Mishandling leads to retrieving deleted or unauthorized "ghost data" (see [RAG Knowledge Base Document Update Strategies](./rag-knowledge-update.md)).
5. **Continuous Token and Operational Overhead**: While model training costs are avoided, every query concatenates retrieved snippets as input Tokens, alongside the ongoing maintenance of vector indices and offline evaluation pipelines.

## Summary

The core value of RAG is constraining LLM answers to external evidence that is searchable, citable, and permission-controlled.

When making architectural choices, keep these three primary guidelines in mind:

1. Use traditional search when the goal is simply locating original files; use RAG when synthesizing, summarizing, or answering specific questions across snippets is required.
2. Prioritize RAG when knowledge changes frequently, permissions require strict data isolation, and source citations are required; consider fine-tuning when adjusting tone/style, fixing output formatting, or distilling specialized capabilities.
3. Use long context windows directly for global reading of single long documents; rely on RAG to narrow the evidence scope across large-scale document repositories.

A working demo only validates vector store connectivity. Production-grade RAG demands substantial effort invested in document parsing quality, hybrid search and rerank tuning, incremental update consistency, and regression against static evaluation benchmarks.

Interview self-check questions:

- What is RAG? What core LLM limitations does it solve?
- What is the difference between RAG and traditional search engines? When is RAG unnecessary?
- How do you choose between RAG and Fine-tuning? In what scenarios should they be combined?
- How do you select an Embedding model in a RAG system? Why shouldn't you rely solely on MTEB rankings?
- What are the differences between cosine similarity, inner product, and Euclidean distance? What is their relationship after vector normalization?
- Why do hallucinations still occur with RAG? From which stages should you investigate and mitigate them?
- What is the "Lost in the Middle" problem? Why can't long context windows completely replace RAG?
- What are the core differences between Naive RAG, Advanced RAG, and Modular RAG?
