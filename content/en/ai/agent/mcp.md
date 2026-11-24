---
title: What is the Model Context Protocol (MCP)? How Does It Relate to Function Calling and Agents?
description: Core concepts of MCP (Model Context Protocol), its four-layer architecture, JSON-RPC 2.0 communication mechanism, and production-grade MCP Server development practices.
category: AI Application Development
lang: en
sourceRef: zh-ref/ai/agent/mcp.md
head:
  - - meta
    - name: keywords
      content: MCP,Model Context Protocol,JSON-RPC,Function Calling,AI Agent,Tool Integration,Anthropic
---

When connecting the same Git tool to Claude Desktop, Cursor, and an in-house Agent, developers frequently find themselves writing a bespoke integration layer for each client. Whenever tool arguments, authentication schemes, or protocol versions change, every client wired to that tool must be updated in lockstep.

MCP standardizes how external systems expose capabilities as Servers, allowing protocol-compliant Hosts to discover and invoke those capabilities through Clients. It addresses the integration of tools and data sources; how the model decides to invoke them and how tasks are orchestrated remain the responsibilities of Function Calling and Agents.

![MCP Diagram](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/mcp-simple-diagram-cfea1892.png)

> This article is primarily based on the current stable [2026-07-28 revision](https://modelcontextprotocol.io/specification/2026-07-28). The preceding `2025-11-25` revision utilized initialization handshakes and transport-layer sessions; `2026-07-28` shifted to stateless, self-describing requests, eliminating the `initialize`/`initialized` handshake and `Mcp-Session-Id`, and moving Tasks into the `io.modelcontextprotocol/tasks` extension. Backward-compatible clients and SDKs may still operate on `2025-11-25`, so always verify protocol revision, SDK versions, and Host capabilities before integrating.

## What Exactly is MCP?

MCP stands for Model Context Protocol.

Breaking down the acronym makes its purpose intuitive:

- Model: Designed for Large Language Model applications;
- Context: Bringing external context, tools, and data sources to the model;
- Protocol: Standardizing interaction patterns via an agreed protocol specification.

However, MCP should not be trivialized as merely "adding plugins to a model." Many engineers initially view it this way when discussing MCP in developer communities.

More accurately, MCP is a **communication protocol between an MCP Client and an MCP Server**. The Host handles user interaction and model invocations, the Client communicates with the Server, and the Server exposes concrete capabilities.

Consider a commonplace scenario:

A user asks: "Check what changed in the latest commit of this repository."

The model or Agent inherently knows nothing about your local Git repository's commit history. It must rely on an external capability to read Git logs.

Without MCP, every AI application must devise its own proprietary approach for "how to connect to Git tools, pass arguments, and receive outputs."

With MCP, Git capabilities are packaged into an MCP Server. An MCP Client embedded within the Host connects to it, discovers available tools, invokes them via the protocol, and returns the output to the model for analysis.

Protocol adaptation for the Git tool is centralized on the Server side, while the Agent or AI application focuses solely on understanding the user's intent, selecting the tool, and synthesizing results. Neither side needs to re-negotiate proprietary interfaces for every individual client.

## What is the Relationship Between MCP, Function Calling, and Agents?

In a task like "read the latest commit of a repository," Function Calling, MCP, and Agents may all appear simultaneously, but each operates at a distinct layer: the model first articulates a structured invocation intent, the Host routes it to the actual tool, and the Agent decides whether to proceed based on the returned result.

Consider a model-generated invocation intent:

```json
{
  "name": "read_file",
  "arguments": {
    "path": "/repo/README.md"
  }
}
```

OpenAI terms this mechanism Function Calling; Anthropic refers to it as Tool Use. Models leverage it to emit structured payloads like "invoke `read_file` with this path argument."

MCP bridges this intent to external systems: which Server provides the tool, how requests are transported, and how responses are delivered.

The Agent governs the broader task lifecycle. It inspects tool results to decide whether to make another call, terminate the task, or await human confirmation; planning, memory, and looping all reside at this tier.

![FC / MCP / Agent Three-Layer Relationship](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/mcp-fc-agent-layer-c857389e.png)

Viewing all three within a single request pipeline clarifies their division of labor: Function Calling generates commands, MCP transports commands and connects tools, and the Agent determines when the chain continues or halts.

The primary focus varies across scenarios:

| Scenario | Primary Concern | Rationale |
| --- | --- | --- |
| Having a model decide whether to check the weather | Function Calling | Focuses on model translating intent into structured arguments |
| Allowing Claude Desktop to read local files | MCP | Focuses on standardized interface between host and local filesystem |
| Autonomous AI troubleshooting of production incidents | Agent | Focuses on multi-step decision-making, tool execution, and feedback loops |

In production projects, all three frequently coexist; the table serves to delineate primary architectural boundaries.

## What Components Make Up MCP?

The MCP communication topology consists of Host, Client, and Server.

![MCP Four-Layer Architecture](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/mcp-four-layer-architecture-fe3b7a7f.png)

The Host is the AI application interacting with the user, such as Claude Desktop, Cursor, AI extensions in VS Code, or custom Agent platforms.

The Client resides inside the Host, responsible for exchanging protocol messages with the MCP Server. Under `2025-11-25` and earlier revisions, the Client established sessions via initialization handshakes; under `2026-07-28`, it utilizes stateless requests without establishing transport sessions. A single Host can connect to multiple Servers, typically managing one Client per Server.

Developers predominantly author Servers. File reading, SQL queries, GitHub Issue lookups, and internal ticket operations are exposed to the Host through the Server.

Behind the Server lie the actual data sources: local files, databases, internal platforms, GitHub, or third-party APIs. They are not formal protocol participants in MCP. The Host interacts exclusively with the Server via the Client; low-level database querying and API calling remain encapsulated inside the Server.

## How Does an MCP Invocation Flow?

Returning to the example: "Analyze the latest commit of this repository."

![MCP Call Sequence Diagram](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/mcp-call-seq-2ea44739.png)

Upon recognizing that it lacks Git logs, the model generates a tool call. The Host forwards this call to the MCP Client, which issues a JSON-RPC request to the Server; the Server queries Git and returns the output along the reverse path, allowing the model to formulate its response.

Tool names, `description` fields, parameter schemas, and negative use cases directly influence model selection. Parameters received by the Server must always be treated as untrusted input: file access must be restricted to whitelisted directories, SQL must be parameterized, high-risk operations must require human approval, and sensitive return data must be redacted.

In the `2026-07-28` revision, MCP no longer requires `initialize`/`initialized` handshakes or `Mcp-Session-Id`. Each request is self-contained with protocol version and client capability declarations. The [specification mandates](https://modelcontextprotocol.io/specification/2026-07-28/basic/versioning) that Servers must implement `server/discover`, but Clients are permitted to bypass it and send requests directly. Backward-compatible clients using `2025-11-25` or earlier will still perform the initialization handshake. When debugging tools that fail to appear, verify the protocol revision chosen by both Client and Server first, then inspect modern request capability metadata or legacy handshake payloads.

## Does MCP Only Expose Tools?

Discussions in developer communities frequently fixate on Tools alone, which is understandable given that tool calling is the most intuitive capability. However, MCP encompasses more than just tools.

### Resources, Tools, and Prompts

A Server can expose three primary capability primitives: Resources, Tools, and Prompts.

Resources provide read-only context, such as local files, log excerpts, database schemas, or configuration records.

Tools perform active operations, such as executing database writes, sending messages, opening tickets, or calling business APIs. Capabilities that actively execute logic and potentially alter external state belong under Tools.

Prompts are reusable prompt templates, such as "review code against team conventions" or "convert API documentation into test suites."

Tools are typically selected and invoked autonomously by the model; Resources and Prompts can also be surfaced and selected by the Host, user interfaces, or higher-level application logic.

An everyday analogy illustrates Resources, Tools, and Prompts:

A guest says: "I want a plate of cucumber salad."

The LLM acts as the chef, knowing the general recipe, but requiring external provisions:

- Resources are like ingredients and recipes: what is in the fridge, whether cucumbers exist in the pantry, where seasonings are stored;
- Tools are the physical actions: chopping vegetables, mixing seasonings, turning on the stove, ordering groceries online;
- Prompts are household dietary preferences: low spice, extra cilantro, no garlic.

If tool descriptions are inaccurate—such as describing "cucumber" as "tomato"—the model will select the wrong tool.

In production environments, tool names, argument descriptions, and return payloads directly dictate Agent decisions. Having a Server start up successfully is merely step one; capability boundaries must be clearly intelligible to the model.

### Roots, Sampling, and Elicitation

Beyond Server-side capabilities, the Client side can also offer capabilities for the Server to consume, such as Roots, Sampling, and Elicitation. In `2026-07-28`, Roots, Sampling, and Logging are marked as deprecated (retained for at least 12 months); Tasks have transitioned into the `io.modelcontextprotocol/tasks` extension. New implementations should first verify whether target Clients/Hosts support these capabilities or extensions.

Roots allow the Host, via the Client, to inform the Server of the filesystem root directories expected within the active scope. For example, a Host might expose the current project directory while concealing the user's home directory. It acts as capability negotiation and scope signaling rather than an automated filesystem sandbox; the Server must still enforce path normalization, boundary checks, and OS-level permission isolation.

Sampling is unique: it allows the Server to request an LLM generation from the Host side. For instance, after reading an error log, the Server might request the Host's LLM to summarize or classify the log excerpt.

Elicitation enables the Server to ask the user follow-up questions during execution. When parameters are incomplete, options are ambiguous, or confirmation is required prior to execution, the Host renders an interactive prompt.

Adopt these capabilities selectively. Most MCP Servers can begin with Tools alone; consider Resources and Prompts when read-only context or standardized entry points are needed. Roots, Sampling, Elicitation, and the Tasks extension depend on Host implementation and cannot be assumed simply because Server SDKs expose the interfaces.

## Why Does MCP Use JSON-RPC?

MCP utilizes JSON-RPC 2.0 for underlying transport messaging.

REST is resource-centric (e.g., `/users/1`, `/orders/100`), whereas JSON-RPC is method-centric (e.g., `tools/call`, `resources/read`). AI tool calling is inherently action-oriented ("I want to execute this operation"), making JSON-RPC a natural fit for MCP.

Per the [2026-07-28 specification request metadata fields](https://modelcontextprotocol.io/specification/2026-07-28/basic/index), a tool call request looks like this. Note that `_meta` sits inside `params` alongside `name` and `arguments`; `my-app` and `1.0` represent example client identity, and an empty capabilities object declares that no optional client capabilities are asserted:

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "read_file",
    "arguments": {
      "path": "/path/to/file.txt"
    },
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientInfo": {
        "name": "my-app",
        "version": "1.0"
      },
      "io.modelcontextprotocol/clientCapabilities": {}
    }
  },
  "id": 1
}
```

A successful response:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "resultType": "complete",
    "content": [
      {
        "type": "text",
        "text": "File contents..."
      }
    ]
  }
}
```

Failure responses return `error`:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32602,
    "message": "Invalid params"
  }
}
```

Successful responses return only `result`; failure responses return `error`. Never append `error: null` to successful responses.

JSON-RPC messages are plain text, simplifying logging while remaining decoupled from specific transport media. The tradeoff is the absence of strong IDL and compile-time type enforcement found in gRPC. While MCP leverages JSON Schema to describe parameters, Schemas serve simultaneously as runtime validation rules and prompt cues for the model; Servers must still enforce rigorous input validation.

## Choosing Between stdio and Streamable HTTP

Local Servers typically employ stdio. The Host spawns the Server as a child process and exchanges messages over stdin/stdout; many local Servers in Claude Desktop operate this way. It incurs no network deployment overhead, but because the Server runs on the local machine, filesystem, shell, and database permissions must be tightened individually.

Third-party Servers should never be executed raw without inspection. Review source code first, or isolate them using Docker, cgroups, or namespaces. For Servers dealing with filesystems, shells, or databases, excessive permissions granted upfront are difficult to remediate later.

Under stdio, stdout acts as the JSON-RPC message conduit and must never be used for debug logging. A single stray `print()` statement can corrupt JSON-RPC formatting, triggering Host parse failures or disconnections. Debug logs must be directed to stderr or log files; when investigating "Server failed to launch", ensure stdout remains clean of log pollution.

Remote Servers are best suited for Streamable HTTP. Early remote MCP transports commonly combined HTTP + SSE before converging on Streamable HTTP; legacy HTTP+SSE is now marked as deprecated. `2026-07-28` maintains Streamable HTTP but adopts stateless requests, requiring requests to carry `Mcp-Method` and `Mcp-Name` headers. Authentication, load balancing, and API gateways can follow standard HTTP operational practices.

```http
POST /mcp HTTP/1.1
Authorization: Bearer xxx
Content-Type: application/json
Accept: application/json, text/event-stream
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: read_file
```

The above represents the HTTP headers corresponding to the earlier `read_file` invocation, with the request body using the earlier JSON payload; `Mcp-Method` matches the method name, and `Mcp-Name` matches the tool name, as detailed in the [Official Release Notes](https://blog.modelcontextprotocol.io/posts/2026-07-28/). Responses may be standard JSON or SSE streams depending on the request type.

Select transports based on deployment topology and access scope:

- Local tools, local files, single-user workflows: prefer stdio.
- Team services, remote APIs, multi-user deployments: prefer Streamable HTTP.
- For write operations and sensitive data, implement authentication, rate limiting, and auditing regardless of transport.

![MCP Transport Decision Guide](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/mcp-transport-decision-766dfe57.png)

## Does MCP Merely Enable Models to Call APIs?

Function Calling already allows models to express "which API to invoke." MCP solves the problem of redundant integration when delivering the same tool across multiple Hosts.

For example, after connecting an internal ticketing system to an Agent, switching to a different Host often requires rewriting connection plumbing, parameter serialization, and response parsing. By packaging capabilities as an MCP Server, any application supporting an MCP Client can integrate them using identical discovery and invocation conventions.

This division mirrors backend-frontend collaboration via interface contracts: Agent engineering focuses on tasks and interaction flows, while tool engineering focuses on capability implementation, data permissions, and operational guardrails.

Team runbooks, on-call documentation, post-mortems, and troubleshooting scripts often sit scattered across documentation portals, wikis, or script repositories. Once query and diagnostic capabilities are organized into a Server, the Agent can search documentation, read configurations, and run tools within authorized scopes, rather than offering generic text guidance.

## Can an MCP Integration Go Straight to Production?

No. The quick demo loop of "install a Server, ask a question, get an answer" is trivial; production deployments demand interface contracts, auditing, and operational governance.

Whether timestamp fields follow ISO-8601 or epoch timestamps, whether currency units are dollars or cents, and what default pagination values are must be defined in Schemas, field descriptions, and examples. Servers must validate arguments accordingly and return informative errors enabling the model to self-correct requests.

A single Agent response may traverse multiple Servers and tools. Trace IDs, structured logs, and call chains must record invocation arguments, latency, summary results, and error codes to identify which hop influenced the final response.

Local stdio inherits local filesystem permissions, while remote Servers connect to internal systems. Permissible directories, queryable tables, whether write APIs are reachable, and whether outbound emails can be sent must be authorized explicitly. Destructive actions like deletion, mutation, messaging, and production calls require two-factor confirmation, audit logging, and rollback strategies.

Server `description` strings, prompt templates, and return payloads must also be audited: malicious or careless content can introduce prompt injections, coaxing the model into exfiltrating sensitive data or reading unauthorized files. Server provenance, dependencies, permission scopes, and changelogs belong in release reviews.

Model tokens, vector queries, third-party APIs, and cloud resources incur tangible financial costs. Invocations must attribute back to users, business units, and tools; otherwise, pinpointing cost spikes becomes impossible.

Breaking changes to tool parameters, enums, or return schemas can distort model judgments. Tool-level versioning, canary rollouts, legacy version maintenance, and automated regression tests must be maintained alongside the Server.

## Pre-Production Checklist for Enterprise MCP Adoption

### Schema and Versioning

- Does every tool have explicit input and output Schemas?
- Are units, timestamp formats, enum values, and defaults documented?
- Do tool interfaces carry version identifiers?
- Are canary deployments and rollbacks available for breaking changes?
- Is automated validation enforced against Schemas?

### Permissions and Security

- Which files, directories, databases, and APIs can the Server access?
- Are read-only tools strictly separated from mutating write tools?
- Do high-risk actions mandate human confirmation?
- Are return values sanitized and redacted?
- Are protections in place against path traversal, SQL injection, and command injection?
- Have third-party MCP Servers undergone source code, dependency, and permission audits?

### Observability

- Does every user request carry a Trace ID?
- Are invocation parameters, latency, result summaries, and error codes recorded in structured logs?
- Can the end-to-end tool invocation chain behind an Agent response be reconstructed?
- Are timeout, rate limiting, circuit breaking, and retry policies configured?

### Cost Attribution

- Can every invocation be attributed to a user, business unit, tool, and session?
- Are token costs, API fees, and cloud resource expenses individually quantifiable?
- Are quota limits and budget alerts established?
- Does a hard cap exist on tool invocations when models enter loops?

### Dependency Governance

- Do MCP SDKs, third-party libraries, and third-party Servers have active maintainers and update histories?
- Who is responsible for tracking security vulnerabilities?
- Are staging environments and rollback plans defined for Server upgrades?
- Are core business capabilities safeguarded against unmaintained third-party extensions?

These criteria mirror standard backend operational rigor. MCP changes how tools are connected, but does not substitute for authentication, auditing, logging, versioning, or rate limiting.

## Best Practices When Writing an MCP Server

### Avoid Pursuing Monolithic "Omni-Tools"

A common architectural misstep is creating a few "do-everything" tools:

```text
execute_sql(sql)
file_operation(op, path, data)
call_api(url, method, body)
```

Interfaces like `execute_sql` and `file_operation` delegate operational scope and safety checks entirely to the model's discretion. The broader the arguments, the greater the blast radius for misuse and unauthorized access. Decomposing into discrete business actions allows Schemas, permissions, and auditing rules to bind to specific tools:

```text
get_user_by_id(id)
list_active_orders(user_id)
read_file(path)
write_report(path, content)
```

Tool names should follow verb-noun conventions, while `description` fields state applicability conditions, mandatory arguments, and prohibited scenarios.

For example, a slow SQL investigation tool should state: invoke when service latency spikes, database timeouts occur, or CPU usage surges with suspected database correlation; do NOT invoke for network or memory issues. Such constraints reduce instances where models route similar questions to wrong tools.

### Handle Large Files and Long Texts Carefully

Logs, Markdown files, HTML payloads, and CSV exports can easily blow past model context windows. Resource endpoints should first return metadata: filename, size, last modified time, summary, and readable offsets; full content should be read in chunks on demand.

Chunk sizing should balance context budgets, response size limits, and server resource constraints; return summaries and pagination metadata first, chunking content on demand rather than streaming entire files blindly. This prevents exhausting context while shielding the Server from memory and network spikes.

Never couple truncation limits to a specific model's tokenizer. Different models use different tokenization schemes; Servers should enforce coarse-grained limits using character or byte counts, leaving final context trimming to the Host or application layer.

### Security Cannot Rely on Trusting the Model

File operations must validate directory boundaries after path normalization, preventing `../` from traversing outside permitted roots. SQL queries must use parameterized statements rather than executing model-assembled strings directly.

Phone numbers, email addresses, auth tokens, secret keys, and internal URLs in return payloads must be masked. Write operations—deleting files, mutating databases, sending emails, invoking production APIs—must default to least privilege with human approval and audit logging.

When an Agent enters a loop, it may invoke the same tool repeatedly. Rate limits, timeouts, circuit breakers, and quotas must be enforced by the Server itself, rather than assuming the Host will safeguard downstream services.

For comprehensive strategies regarding Prompt Injection, Token Passthrough, resource-level authorization, local Server isolation, and third-party Skill/MCP supply chain security, refer to [LLM/Agent Security in Practice](../system-design/llm-security.md).

### Minimal MCP Server Example: Getting One Tool Running

Using the Python SDK's FastMCP pattern, a weather Server looks like this. Note that import paths and initialization routines should be cross-referenced against your pinned SDK version:

```python
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("weather-server")

@mcp.tool()
def get_weather(city: str) -> str:
    """Retrieve weather information for a specified city"""
    return f"{city} is sunny today, temperature 25°C"

@mcp.resource("weather://forecast")
def weather_forecast() -> str:
    """Return weather forecast for the upcoming week"""
    return "7-day weather forecast..."

if __name__ == "__main__":
    mcp.run()
```

In Claude Desktop, configure it as follows:

```json
{
  "mcpServers": {
    "weather-server": {
      "command": "uv",
      "args": ["run", "--with", "mcp", "/path/to/weather_server.py"]
    }
  }
}
```

For local debugging, use MCP Inspector directly:

```bash
# Python Server
npx @modelcontextprotocol/inspector uv run --with mcp /path/to/weather_server.py

# Node Server
npx @modelcontextprotocol/inspector node build/index.js
```

Inspector simulates Host requests. Server connectivity, tool discovery, and parameter validation errors can all be observed and diagnosed here first.

In production, never depend on global `python` having `mcp` installed. Use virtual environment interpreters or explicitly declare dependencies using `uv run --with mcp ...` for consistency. If Claude Desktop fails to launch a Server, inspect `mcp.log` first—issues are frequently caused by incorrect paths or missing dependencies rather than protocol bugs.

## Validating Remote Servers with Inspector

The preceding examples launch local processes via stdio. To inspect connection negotiation, tool discovery, and execution on remote Servers, use [MCP Inspector](https://github.com/modelcontextprotocol/inspector) connected over Streamable HTTP.

Here we use [Parallel Search MCP](https://docs.parallel.ai/integrations/mcp/search-mcp) as an example. It provides `web_search` and `web_fetch`, with an anonymous endpoint at `https://search.parallel.ai/mcp` requiring no Parallel account or API key (free tier includes rate limits).

Using Inspector 2.5.0 (requires Node.js 22.19.0 or higher), list tools from the terminal:

```bash
npx --yes @modelcontextprotocol/inspector@2.5.0 --cli \
  https://search.parallel.ai/mcp --transport http --method tools/list
```

`--transport http` specifies Streamable HTTP. Inspector chooses between modern stateless flows or compatible legacy initialization based on protocol revisions supported by the Server, then issues `tools/list`; the response should display `web_search`, `web_fetch`, and their argument Schemas. This anonymous call omits `Authorization` headers.

Next, invoke the search tool to find official documentation on Java Virtual Threads:

```bash
npx --yes @modelcontextprotocol/inspector@2.5.0 --cli \
  https://search.parallel.ai/mcp --transport http \
  --method tools/call --tool-name web_search \
  --tool-arg 'objective=Find official OpenJDK documentation regarding Java Virtual Threads' \
  --tool-arg 'search_queries=["OpenJDK JEP 444 virtual threads"]'
```

`objective` and `search_queries` are required parameters, the latter being a JSON array. Tool results contain source URLs and content excerpts. When troubleshooting, distinguish between connection drops, JSON-RPC errors, and tool-level failures indicated by `isError: true`; receiving HTTP 200 does not inherently mean tool execution succeeded.

During search or extraction, queries, target URLs, and objective descriptions are sent to Parallel; transmit only content suitable for third-party processing. This CLI command disconnects upon completion without installing persistent services. If subsequently enabled in an Agent, tools can be invoked autonomously as needed and disabled or removed when finished.

## Documenting Protocol Revisions During Integration

MCP unifies capability discovery and invocation between Hosts, external tools, and data sources, but does not supplant business authentication, data authorization, or audit logging. A Server operating cleanly within one Host does not guarantee that another Host supports optional capabilities like Sampling, Elicitation, or Tasks.

When building a minimal Server, pin the protocol revision and SDK version first, using Inspector to validate connection negotiation, capability discovery, argument parsing, and error responses. Before integrating remote services, implement OAuth, rate limiting, tracing, version compatibility, and rollbacks; ensure file and shell tools enforce directory validation and sandboxing on the Server side.

## Summary

MCP establishes a standardized discovery and invocation mechanism across Hosts, Clients, and Servers, solving the integration of external tools and data sources. How models decide to invoke tools, how business logic is orchestrated, and whether requests are authorized remain governed by Function Calling, Agent/Workflow systems, and business security policies, respectively.

When integrating, confirm protocol revisions, SDKs, and Host capability negotiations first, validating connectivity, Schemas, and error handling with a minimal Server. In production environments, tool permissions, data redaction, directory and SQL validation, rate limiting, auditing, and version compatibility must be enforced collaboratively by both Server and Host.
