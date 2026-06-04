# Core node types

ArcPX pipelines use many `node.type` values. The **npm package** builtin (`createBuiltinNodeExecutor()`) handles core flow + LLM types. **Extensions** (e.g. `webpage`) and **community** handlers are registered in your composed `nodeExecutor`.

| Layer | Location | Examples |
|-------|----------|----------|
| Package builtin | `async-dag` → `createBuiltinNodeExecutor()` | `genText`, `pipeNode`, `text` |
| Extensions | Your code / [`handlers/builtin.mjs`](../examples/lib/handlers/builtin.mjs) | `webpage`, `llm`, `chat` |
| Community | [`registry.mjs`](../examples/node-types/registry.mjs) | `bigQuery`, `markdownOutput` |

How to add `webpage` and other custom types: **[Extending the builtin executor](./extending-builtin-executor.md)**.

## Package builtin (`createBuiltinNodeExecutor`)

| `node.type` | Notes |
|-------------|--------|
| `text`, `startNode` | `data.nodeData` string |
| `pipeNode` | Pass-through `sourceData`, `outputTarget`, `isPassThrough` |
| `genText`, `LLM` | LLM via `GraphEngine({ llm })` — [llm-config.md](./llm-config.md) |
| `groupNode` | Canvas group metadata |
| `endNode`, `standardOutput` | Returns upstream |

## Extensions (example repo)

| `node.type` | Handler | Notes |
|-------------|---------|--------|
| `webpage`, `webScraper` | [web-scraper](../examples/node-types/web-scraper/) | Fetch URL → `{ title, text, url }` |
| `llm`, `chat` | OpenAI-compatible client | Uses `llm` settings when `provider: "openai"` |

## Community / custom

[`registry.mjs`](../examples/node-types/registry.mjs): `bigQuery`, `xApi`, `markdownOutput`, `aiRepos`, plus `npm run generate:handler`.

## Runners

- `examples/run-local.mjs` — extensions + community + builtin
- `examples/run-with-llm.mjs` — same + `GraphEngine({ llm })` from `.env`

```bash
npm run run:output-chaining   # webpage + genText (needs .env.bedrock)
```

[Extending builtin](./extending-builtin-executor.md) · [Node handlers](./node-handlers.md) · [LLM config](./llm-config.md)
