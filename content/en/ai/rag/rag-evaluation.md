---
title: "RAG Evaluation: From Offline Datasets to Online Observability"
description: "A beginner-friendly guide to RAG evaluation methodologies, covering evaluation dataset construction, Hit@K, Evidence Recall, MRR, answer faithfulness, refusal evaluation, version comparison, and online observability."
category: AI Application Development
head:
  - - meta
    - name: keywords
      content: RAG evaluation,RAG assessment,Hit@K,MRR,Faithfulness,refusal evaluation,LangSmith,Ragas,observability
lang: en
sourceRef: zh-ref/ai/rag/rag-evaluation.md
---

A knowledge base question-answering system can output a smooth, articulate paragraph, but how do you objectively evaluate whether it answered well? Did it locate the correct source material? Is the answer substantiated by evidence? When information is insufficient, does it fabricate facts or refuse gracefully? All of these require rigorous evaluation.

Starting from an individual knowledge base QA scenario, this article introduces how to construct evaluation samples, independently evaluate retrieval versus generation, and use evaluation results to guide optimization. If you are new to the end-to-end question-answering workflow, start with [RAG Fundamentals](./rag-basis.md).

## What is RAG Evaluation?

**RAG evaluation is the process of measuring the performance of a retrieval-augmented generation system against predetermined, objective standards.** Beyond scoring the final generated answer, evaluation inspects the retrieved results and the operational execution trace of the request.

Suppose an instructional product manual contains the following passage:

> The file upload limit for Standard Edition is 20 MB, whereas Professional Edition supports up to 100 MB. Files are retained for 7 days after upload and automatically deleted upon expiration.

A user asks: "What is the maximum file upload size for the Standard Edition, and how long are files retained after upload?" The system must retrieve two distinct pieces of evidence—the upload limit and the retention window—before answering "20 MB and 7 days."

| Evaluation Target | Question to Answer | Example |
| --- | --- | --- |
| Retrieval Results | Was the necessary evidence successfully found? | Were both "20 MB" and "7 days" retrieved simultaneously? |
| Generated Answer | Is the answer correct, complete, and grounded in evidence? | Did the model mistakenly cite the 100 MB Pro limit as the Standard limit? |
| Execution Process | Did the request complete, and at what computational cost? | Did the request time out, and what were total latency and token expenditures? |

If the user follows up with "Can deleted files be recovered?", this manual passage provides no answer. The evaluation must verify whether the system explicitly acknowledges that documentation is insufficient, rather than hallucinating "yes, they can be restored" or "no, they cannot."

An evaluation cycle typically requires a curated question set, a pinned corpus, explicit grading criteria, and logged execution runs. Ground-truth reference answers facilitate scoring, but models should not be penalized for phrasing variations: "one week" and "7 days" convey identical meaning.

## Why is RAG Evaluation Necessary?

If you tune chunk size from 800 down to 400 tokens and a specific question's answer improves, does that prove the new configuration is superior? Not necessarily. Evidence for that question might have become easier to retrieve, or the model simply generated a more coherent response on that particular run. Meanwhile, evidence for other questions may have been fragmented, degrading overall performance.

Only by comparing configurations across the exact same benchmark of questions and source documents can you understand how a change affects the system as a whole. Evaluation is primarily used to:

- **Select Configurations**: Compare the trade-offs of chunking methods, embedding models, Top-K thresholds, rerankers, and prompt templates across quality and cost.
- **Isolate Failure Roots**: Differentiate between retrieval misses, evidence lost during context assembly, generation misinterpretation, and execution timeouts.
- **Guard Against Regressions**: Ensure that fixing one category of errors does not quietly break previously functional queries.

Looking solely at aggregate end-to-end scores conceals where problems lie. If the manual defines retention duration but retrieval fails to surface it, debug retrieval; if evidence enters the prompt yet the model responds with "files are retained indefinitely," debug prompt constraints and generation.

**Offline evaluation** uses curated, pre-annotated benchmark datasets and is ideal for comparing software versions. **Online observability** traces real-world production requests—logging status codes, latencies, and intermediate artifacts—to triage live incidents; sampling and scoring these production traces provides ongoing online quality assessment. Note that "offline" does not mean air-gapped; querying hosted external model APIs still incurs operational latency and costs.

[LangSmith's Evaluation Concepts documentation](https://docs.langchain.com/langsmith/evaluation-concepts) outlines the complementary dynamic between offline experiments and online evaluation: production anomalies are discovered online, sanitized into offline regression benchmarks, and used to validate fixes before redeployment.

## How to Construct an Evaluation Dataset?

### Start with Questions, Evidence Anchors, and Reference Key Points

Begin with a compact, manageable question set that can be audited item by item, covering direct factoids, paraphrased queries, cross-passage synthesis, partially answerable scenarios, and out-of-scope questions. Scale volume gradually, ensuring every benchmark item has unambiguous ground truth.

Below is an annotated sample corresponding to the product manual example. The field structure illustrates clean schema design rather than a mandatory vendor framework format:

```json
{
  "id": "upload-01",
  "question": "What is the maximum file upload size for the Standard Edition, and how long are files retained after upload?",
  "corpusVersion": "manual-v1",
  "expectedEvidence": [
    { "id": "upload-limit", "text": "The file upload limit for Standard Edition is 20 MB" },
    { "id": "retention", "text": "Files are retained for 7 days after upload and automatically deleted upon expiration" }
  ],
  "referenceKeyPoints": ["Upload limit is 20 MB", "Retained for 7 days"],
  "answerability": "FULL",
  "reviewStatus": "PENDING"
}
```

Ground-truth evidence anchors verify whether retrieval located the factual basis; reference key points verify whether the generated answer is complete. Both must trace back to the identical corpus version.

When chunking parameters are modified, chunk IDs invariably shift. Therefore, when benchmarking chunking strategies, label ground truth using original document character offsets, short stable text anchors, or immutable fact IDs, which are subsequently mapped to retrieved passages. Never evaluate new chunking strategies directly against legacy chunk IDs.

While exact string matching is simple to implement, it frequently fails on cross-chunk passages, tabular conversions, or synonymous rephrasings. When adopting string matching, establish clear normalization rules and manually audit samples flagged as false negatives.

### Distinguish Fully Answerable, Partially Answerable, and Unanswerable Queries

Answerability must be evaluated against the designated corpus version, user access permissions, and authorized information boundaries. For closed-domain systems restricted strictly to the knowledge base, classify queries into three categories:

| Category | Source Availability | Expected Behavior |
| --- | --- | --- |
| `FULL` | Covers all information required | Answer completely and provide accurate citations |
| `PARTIAL` | Covers only a subset of the question | Answer supported parts and explicitly state what is missing |
| `NONE` | Information absent or unsupported | Explicitly decline to answer without fabricating facts |

For instance, "How long are uploaded files retained, and can they be restored after deletion?" is partially answerable. Answering "Files are retained for 7 days; the manual does not specify whether recovery is possible after deletion" is correct. Treating this as a strict refusal penalizes the system for answering the valid sub-question; demanding that it answer recovery procedures encourages hallucination.

Answerability classifications, key points, and evidence anchors must undergo verification. Programmatically generated labels can start as `PENDING`, transitioning to `REVIEWED` after human validation. **A pending review status is neither a pass nor a fail.** Formal evaluation reports must publish both the count of verified scoring samples and the tally of pending reviews.

### Separate Development Sets from Holdout Test Sets

A development set is used for tuning hyperparameters and debugging errors; a holdout test set evaluates generalizability on questions not touched during tuning. Group query paraphrases and templated variations into question families, ensuring entire families reside exclusively on one side to prevent data leakage.

Questions repeatedly referenced while fine-tuning rules remain useful as regression tests, but can no longer be claimed as unbiased blind evaluations. Furthermore, retain in-domain distractor documents in the corpus: if a knowledge base contains only 5 chunks while Top-K is set to 8, returning the entire repository yields an artificially inflated hit rate, masking retriever deficiencies.

## How to Evaluate Retrieval Quality?

Define the evaluation target explicitly: are you evaluating coarse retrieval candidates, post-reranking Top-K, or the final context injected into the prompt? Results often diverge across these stages. Record each stage independently to avoid confusing high candidate pool recall with actual evidence delivered to the model.

For samples where expected evidence is confirmed and at least one ground-truth anchor exists, evaluate three primary metrics:

| Metric | Calculation | Focus |
| --- | --- | --- |
| Hit@K | Questions where Top-K contains at least 1 expected evidence item / Valid questions | Did retrieval find any evidence? |
| Evidence Recall@K | Sum of (retrieved evidence items / total expected evidence items per question), averaged across questions | What proportion of total evidence was captured? |
| MRR@K | Mean Reciprocal Rank of the first relevant result per question; 0 if unretrieved within Top-K | How close to the top is the first relevant piece of evidence? |

Evidence Recall here calculates macro-averaged recall based on unique evidence IDs across questions; do not conflate it with chunk-level recall or differently defined metrics in third-party libraries.

Returning to the upload question, which requires both "20 MB" and "7 days" evidence points, suppose Top-3 retrieval yields:

1. Account modification instructions (irrelevant).
2. Standard Edition upload limit is 20 MB.
3. Invoice application guide (irrelevant).

For this query, Hit@3 is 1, Evidence Recall@3 is 1/2 (50%), and the reciprocal rank RR@3 is 1/2. **MRR is the average RR across multiple questions.** Hitting a single evidence piece does not mean all necessary context was retrieved.

Precision@K can also be measured to evaluate the proportion of retrieved chunks that are genuinely relevant. It measures retrieved units rather than discrete factual points, differing in concept from Evidence Recall; specify whether the denominator is fixed at K when fewer than K results are returned.

Out-of-scope questions have no ground-truth evidence; their recall denominator is zero. Mark recall as not applicable (N/A) and evaluate refusal behavior instead. Never count unanswerable questions as 100% recall hits.

## How to Evaluate Generated Answers?

### Decouple Correctness, Completeness, and Faithfulness

| Dimension | Comparison Baseline | Typical Failure Mode |
| --- | --- | --- |
| Correctness | Answer vs. verified ground-truth facts | Stating the Standard Edition upload limit is 100 MB |
| Completeness | Answer vs. reference key points | Answering the upload limit while omitting retention duration |
| Faithfulness | Factual claims in answer vs. provided context | Claiming "files can be restored within 30 days" when context omits recovery policies |
| Relevancy | Answer vs. user query | Replying with account registration steps when asked about file retention |
| Citation Grounding | Cited source span vs. stated factual claim | Providing a link whose content does not support the asserted conclusion |

Correctness and faithfulness are frequently conflated. If context contains an outdated manual and the model answers faithfully according to it, the answer is faithful to context but factually incorrect against current reality. Conversely, if a model guesses correctly from parametric pre-training memory while the retrieved context lacks supporting evidence, the answer is factually correct but not faithful.

[Ragas' Faithfulness metric](https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/faithfulness/) decomposes answers into individual factual claims and verifies whether each claim is supported by context. When implementing this scoring logic, handle empty responses and valid refusals separately; do not treat refusals lacking claims as perfect-score answers.

### Record System Refusals Separately from Semantic Refusals

A programmatic refusal is a structured status code logged by the application, such as `NO_RESULT`; a semantic refusal is conveyed in the natural language response text, such as "Documentation does not provide recovery procedures, unable to confirm." These status identifiers are implementation examples, not universal RAG specifications.

The two can fall out of sync: a model may explicitly refuse in text while the system logs status `ANSWERED`; or keyword filters may classify any response containing "not supported" as a refusal, erroneously flagging technical statements like "Standard Edition does not support batch uploads."

Refusal evaluation consists of two checks:

- **Classification Accuracy**: Whether programmatic status matches verified semantic meaning, tracking false positives and false negatives separately.
- **Behavioral Alignment**: Whether unanswerable questions are rejected; whether answerable questions are mistakenly refused; and whether partially answerable questions preserve supported facts.

For example, when reporting the accurate refusal rate on unanswerable questions, the denominator must strictly be executed, validated unanswerable samples; the false rejection rate on answerable queries uses a distinct denominator. Reports must disclose sample coverage counts alongside percentages.

Avoid using the exact same keyword heuristic to both drive production routing and act as the evaluation judge. If both share the same logic, they simply mirror identical bugs. Code rules excel at deterministic phrasing checks, while human review or calibrated independent evaluators are required to verify semantic intent.

## How Should Execution Failures Be Handled in Metrics?

Network drops, model timeouts, client cancellations, and graceful refusals must be tracked independently. A graceful refusal represents a successfully completed request whose appropriateness can be evaluated; an execution failure produces no valid answer and cannot be included in correctness or faithfulness denominators.

Suppose an evaluation run executes 10 queries: 2 time out, while the remaining 8 pass validation. The report must provide:

- Execution Success Rate: 8/10 (80%).
- Valid Answer Accuracy: 8/8 (100%).
- Timeout Count: 2, detailing failure causes and elapsed latencies.

Reporting only 100% conceals system unavailability. Alternatively, report an end-to-end composite success rate across all submitted queries, explicitly defining how timeouts are penalized.

Each metric should exclude non-applicable and unverified labels, meaning valid sample counts may vary across indicators. When valid samples are zero, return `null` or `N/A` rather than an arbitrary 0% or 100%.

Retry policies also alter benchmark comparisons. When retries are enabled, track attempt counts, initial failure reasons, final outcomes, cumulative latencies, and aggregated costs; do not report only the final successful retry.

## Running an Offline Evaluation Pipeline

You do not need an enterprise evaluation platform to start. A simple script processing JSONL files can execute this workflow:

```text
Load fixed corpus, evaluation samples, and configuration
  -> Invoke the retrieval or QA pipeline under evaluation
  -> Persist candidate chunks, final context, and complete generated answer
  -> Record terminal status, stage latencies, and invocation costs
  -> Compute metrics separately based on valid ground-truth labels
  -> Export per-question breakdowns and summary aggregate reports
```

Reuse production retrieval and context construction code wherever possible; otherwise, you are benchmarking a divergent implementation. For multi-turn conversations, log prior message histories and document whether evaluation exercises production session loading, trimming, and state persistence; evaluating a single completion given static history is not equivalent to live multi-turn conversational testing.

Every evaluation experiment must pin and record: corpus and dataset versions, codebase commit SHA, model names, chunking configuration, Top-K, filter parameters, reranking setup, prompt templates, and evaluator versions. Set bounded timeouts on generation calls, persisting diagnostic failure logs before deciding whether to abort pipeline execution.

Scoring methodologies can be combined. Deterministic code rules suit structural assertions, exact matches, and schema validation; human reviewers establish ground truth and adjudicate disputes; LLM-as-a-judge assists high-volume scoring against explicit rubrics. Model-based grading must archive reasoning explanations, citation references, judge model identifiers, and prompt versions, continuously audited against human benchmarks to detect systematic drift.

For an end-to-end reference, review [LangSmith's RAG Evaluation Tutorial](https://docs.langchain.com/langsmith/evaluate-rag-tutorial). It demonstrates structuring evaluations across answer correctness, relevancy, groundedness, and retrieval precision, illustrating how scoring inputs should be organized; production implementations should supplement these with custom refusal and error handling criteria.

## How to Determine If an Optimization Succeeded

Save a clean baseline first, then change only one primary variable per experiment. When comparing chunk sizes, hold questions, corpus, models, Top-K, and evaluation metrics constant; when comparing models, keep provided context identical.

Evaluation reports must present per-question delta breakdowns alongside aggregate averages. An aggregate metric increase can mask regressions in cross-passage queries or an increase in hallucinations on unanswerable questions. Trace newly introduced errors step-by-step:

1. Did the source text exist, and did parsing retain essential conditions?
2. Did evidence enter the coarse retrieval candidate pool?
3. Did reranking push evidence beyond the truncation cutoff?
4. Did deduplication, compression, or token budgets discard the evidence?
5. When evidence was provided, did the generation model overlook or misinterpret it?

LLM generation exhibits stochastic variance. When sample sizes are small or score deltas are tight, repeat evaluation runs on key samples to report variance; do not declare definitive victory on a single lucky score. Concurrently evaluate latency, token usage, and API expenditures across candidate models.

Regression testing and live generation benchmarking fulfill distinct roles. Running assertions on historical text snippets verifies that a refusal regex was patched; it does not prove the model's freshly generated phrasing will be recognized correctly. After unit regressions pass, validate new model responses on independent test sets.

## What Needs Monitoring After Launch?

Offline benchmarks cannot capture every nuance of real-world user queries. Production systems must correlate queries, retrieval candidates, assembled contexts, model calls, and final outputs under a unified Trace ID to diagnose where failures occur.

| Telemetry Element | Operational Purpose |
| --- | --- |
| Request ID, Session ID, Version Tags | Correlate user feedback with precise system configurations |
| Raw Query and Rewritten Query | Determine whether query rewriting altered user intent |
| Candidate Chunks, Ranks, Applied Filters | Diagnose why evidence was missed or ranked poorly |
| Actual Context, Full Answer, Citations | Evaluate whether generation grounded its response in evidence |
| Terminal Status, Refusal Reason, Exceptions | Differentiate clean refusals, misclassifications, and outages |
| Stage Latencies (Retrieval, Rerank, TTFT, Total) & Tokens | Pinpoint latency bottlenecks and cost spikes |

When storing questions, answers, and context snippets, implement data masking, role-based access control, and retention limits aligned with data privacy regulations; debugging tools must never bypass security boundaries. For timeseries metrics, use bounded labels (model name, version tag, terminal status) rather than embedding raw user prompts or request IDs into metric dimensions.

In production, monitor execution success rate, timeout frequency, refusal ratios, latency percentiles (P95/P99), and operational costs. A rising refusal rate might signal gaps in knowledge base coverage, changing user query distributions, aggressive permission filtering, or false-positive keyword triggers; metrics alone indicate symptoms, requiring trace inspection for root causes.

Answer quality requires continuous sampled human auditing. Sampling should review both normal traffic and targeted slices (user downvotes, system refusals, and novel query clusters); reviewing only negative feedback yields problem triage, not a balanced measure of overall traffic quality. Sanitize confirmed failure cases and merge them into the offline development regression suite, ensuring production fixes are permanently verified before subsequent deployments.

## References

- [LangSmith: Evaluation Concepts](https://docs.langchain.com/langsmith/evaluation-concepts): Understanding datasets, experiments, evaluators, and offline/online evaluation dynamics.
- [LangSmith: Evaluate a RAG Application](https://docs.langchain.com/langsmith/evaluate-rag-tutorial): Practical guidance on organizing multi-dimensional RAG scoring.
- [Ragas: Faithfulness Metric](https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/faithfulness/): Methodology for evaluating factual claims against provided context.
- [AI Application Evaluation Architecture](../llm-basis/llm-evaluation.md): General evaluation benchmarks, quality gates, and launch validation.
- [RAG Optimization: From Retrieval, Reranking to Context Engineering](./rag-optimization.md): Diagnosing and remediating pipeline failures based on per-question evaluations.
