---
sidebar_position: 1
title: Documentation index
---

# async-dag documentation

**Public docs:** [https://arcpx-eng.github.io/async-dag/](https://arcpx-eng.github.io/async-dag/)

**Local preview (clone only, not `npm install async-dag`):** `cd docs-site && npm install && npm start` — see [docs-site/README.md](https://github.com/arcpx-eng/async-dag/blob/main/docs-site/README.md).

| Doc | Description |
|-----|-------------|
| [Getting started](./getting-started.md) | Install, TypeScript quick start, project layout |
| [Scripts](./scripts.md) | npm commands and example runners |
| [API reference](./api.md) | `GraphEngine`, utilities, events |
| [LLM configuration](./llm-config.md) | `GraphEngine({ llm })` — provider, API key, model |
| [Payload guide](./payload-guide.md) | JSON schema, normalize, checklist |
| [Bring your own LLM](./byo-llm.md) | `.env.template`, endpoints, `genText` wiring |
| [ArcPX integration](./arcpx-integration.md) | Export from ArcPX, normalize, run locally |
| [Node handlers](./node-handlers.md) | Missing `node.type` stubs, `npm run generate:handler` |
| [Extending builtin executor](./extending-builtin-executor.md) | Custom types + `webpage` example on top of `createBuiltinNodeExecutor` |
| [Core node types](./core-node-types.md) | Package builtin: `pipeNode`, `genText`, … (`webpage` = extension) |

## Example pipelines

**[All examples + overview diagrams](./examples/README.md)**

| Doc | Command |
|-----|---------|
| [Linear (3 nodes)](./examples/linear-pipeline.md) | `npm run quickstart` |
| [Fan-in (4 nodes)](./examples/fan-in.md) | `npm run run:fan-in` |
| [Fan-out (4 nodes)](./examples/fan-out.md) | `npm run run:fan-out` |
| [Web scraper](./examples/web-scraper-pipeline.md) | `npm run run:web-scraper` |
| [LLM demo](./examples/llm-demo.md) | `npm run run:llm` |
| [Output chaining](./examples/output-chaining.md) | `npm run run:output-chaining` |
| [AI repos (ArcPX-style)](./examples/ai-repos-pipeline.md) | Requires custom `nodeExecutor` + optional LLM |

## Also

- [Contributing](./contributing) — PRs, community node types
- [Security policy](./security) — reporting vulnerabilities
- [Changelog](./changelog)
- [async-dag-ui skill](https://github.com/arcpx-eng/async-dag/blob/main/.cursor/skills/async-dag-ui/SKILL.md) — build a wrapper UI
