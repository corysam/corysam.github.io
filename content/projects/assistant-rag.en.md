---
name: Production RAG assistant
role: Design & development
description: An assistant that answers from a document corpus, with automated evaluations, cost tracking and observability.
mission: >-
  Build, end to end, an LLM service the way production expects it in 2026:
  not a demo, but a measured, traced and deployed system.
problem: >-
  Most RAG projects stop at the prototype. Without an evaluation set, without
  per-request cost tracking and without traces, there is no way to tell
  whether the system gets better or worse when a parameter changes.
method: >-
  Hand-written TypeScript agent loop with tool calling, hybrid search
  (pgvector + BM25) with reranking, a 50-question evaluation set run in CI,
  tracing of every call, a token cost dashboard, and tools exposed through
  MCP. Docker deployment.
result: >-
  In progress. Goal: a public repository with the evaluation results, the
  cost curve and a written retrospective on the architecture choices.
links:
  - label: GitHub repository
    href: "https://github.com/[user]/[repo]"
---
