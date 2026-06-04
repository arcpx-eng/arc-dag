# Scripts & runners

## npm scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Compile TypeScript → `dist/` |
| `npm run quickstart` | [Linear pipeline](./examples/linear-pipeline.md) |
| `npm run run:fan-in` | [Fan-in pipeline](./examples/fan-in.md) |
| `npm run run:fan-out` | [Fan-out pipeline](./examples/fan-out.md) |
| `npm run run:llm` | [LLM demo](./examples/llm-demo.md) (`pipeline-llm-demo.json` + `.env`) |
| `npm run run:local` | Same as `quickstart` |
| `npm run run:web-scraper` | [Web scraper pipeline](./examples/web-scraper-pipeline.md) |
| `npm run test` | Unit tests (`llm` config, placeholders, output chaining) |
| `npm run run:output-chaining` | Fetches → fan-in → `genText` (Bedrock via `GraphEngine({ llm })`) |
| `npm run generate:handler -- <type>` | Scaffold a local `node.type` handler ([node-handlers.md](./node-handlers.md)) |

## CLI runners

| Script | Use when |
|--------|----------|
| [`examples/run-local.mjs`](../examples/run-local.mjs) | Local executor + stubs; see [node-handlers.md](./node-handlers.md) |
| [`examples/run-with-llm.mjs`](../examples/run-with-llm.mjs) | `GraphEngine({ llm })` from `.env` / `.env.bedrock` — [llm-config.md](./llm-config.md) |
| [`examples/normalize-pipeline.mjs`](../examples/normalize-pipeline.mjs) | Clean raw canvas exports |

```bash
node examples/run-local.mjs ./pipeline.json
node examples/run-with-llm.mjs ./pipeline.json ./my-settings.json
node examples/normalize-pipeline.mjs ./raw.json ./clean.json --strip-outputs
```

## Example pipeline files

Overview diagrams: **[examples/README.md](./examples/README.md)**

| File | Nodes | Doc |
|------|-------|-----|
| [`quickstart-pipeline.json`](../examples/quickstart-pipeline.json) | 3 linear | [linear-pipeline.md](./examples/linear-pipeline.md) |
| [`fan-in-pipeline.json`](../examples/fan-in-pipeline.json) | 4 fan-in | [fan-in.md](./examples/fan-in.md) |
| [`fan-out-pipeline.json`](../examples/fan-out-pipeline.json) | 4 fan-out | [fan-out.md](./examples/fan-out.md) |
| [`web-scraper-pipeline.json`](../examples/web-scraper-pipeline.json) | webpage → pipeNode | [web-scraper-pipeline.md](./examples/web-scraper-pipeline.md) |
| [`pipeline-llm-demo.json`](../examples/pipeline-llm-demo.json) | text → genText | [llm-demo.md](./examples/llm-demo.md) |
| [`pipeline-output-chaining.json`](../examples/pipeline-output-chaining.json) | 2× webpage → genText | [output-chaining.md](./examples/output-chaining.md) |
| [`pipeline-ai-repos.normalized.json`](../examples/pipeline-ai-repos.normalized.json) | ArcPX sample | [ai-repos-pipeline.md](./examples/ai-repos-pipeline.md) |
