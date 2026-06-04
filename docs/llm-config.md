# LLM configuration (`GraphEngine({ llm })`)

Pass **provider name**, **API key**, and **model/region** when you construct `GraphEngine`. Credentials are merged into each node's `data.settings` at run time — you do not need to put secrets in pipeline JSON or `globalSettings` files.

## Quick example (Bedrock)

```typescript
import {
  GraphEngine,
  loadFlowFromFile,
  createBuiltinNodeExecutor,
} from "async-dag";

const flow = await loadFlowFromFile("./pipeline.json");

const engine = new GraphEngine({
  flow,
  llm: {
    provider: "bedrock",
    apiKey: process.env.BEDROCK_API_KEY!,
    modelId: "us.anthropic.claude-sonnet-4-6",
    region: "us-east-1",
  },
  nodeExecutor: createBuiltinNodeExecutor(),
});

await engine.run();
```

## Quick example (OpenAI-compatible)

```typescript
const engine = new GraphEngine({
  flow,
  llm: {
    provider: "openai",
    apiKey: process.env.LLM_API_KEY!,
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o",
    systemPrompt: "You are a helpful assistant",
    temperature: 0.5,
  },
  nodeExecutor: createBuiltinNodeExecutor(),
});
```

## `LlmConfig` shape

| Field | Providers | Description |
|-------|-----------|-------------|
| `provider` | **required** | `"bedrock"` or `"openai"` |
| `apiKey` | both | Shorthand API key |
| `modelId` | bedrock | Bedrock model id (e.g. `us.anthropic.claude-sonnet-4-6`) |
| `region` | bedrock | AWS region (default `us-east-1` in handler) |
| `timeoutMs` | bedrock | Request timeout |
| `baseUrl` | openai | Chat completions root (e.g. `https://api.openai.com/v1`) |
| `model` | openai | Model name |
| `temperature` | openai | Sampling temperature |
| `maxOutputTokens` | openai | Max tokens |
| `systemPrompt` | openai | System message |
| `bedrock` | bedrock | Nested `{ apiKey, modelId, region, timeoutMs, userId }` |
| `openai` | openai | Nested `{ apiKey, baseUrl, model, … }` |

Use **shorthand** or **nested** — not both required:

```typescript
// Shorthand
{ provider: "bedrock", apiKey: "…", modelId: "…", region: "us-east-1" }

// Nested
{ provider: "bedrock", bedrock: { apiKey: "…", modelId: "…" } }
```

## What the engine merges

`GraphEngine` calls `mergeLlmConfigIntoGlobalSettings(llm, globalSettings)` and exposes the result via `getGlobalSettings()`.

Each node receives merged settings on `node.data.settings`:

| Setting key | Source | Used by |
|-------------|--------|---------|
| `llmProvider` | `llm.provider` | `genText` routing |
| `bedrockApiKey` | `llm.apiKey` / `llm.bedrock.apiKey` | Bedrock Converse |
| `modelId` | bedrock config | Bedrock model |
| `region` | bedrock config | Bedrock endpoint |
| `llmApiKey` | openai config | OpenAI-compatible API |
| `llmApiBase` | openai `baseUrl` | OpenAI-compatible API |
| `model` | openai config | Chat model |
| `temperature`, `systemPrompt`, … | openai / `globalSettings` | Chat options |

**Merge order:** `llm` defaults first, then `globalSettings` overrides (e.g. per-run `temperature` without touching the API key).

```typescript
const engine = new GraphEngine({
  flow,
  llm: { provider: "bedrock", apiKey: secret, region: "us-east-1" },
  globalSettings: { temperature: 0.2 }, // overrides only; key stays from llm
});
```

Per-node `data.settings` in pipeline JSON still overrides both for that node only.

## Built-in executor

`createBuiltinNodeExecutor()` handles ArcPX core types (`genText`, `LLM`, `pipeNode`, `text`, …) and reads credentials from `node.data.settings`.

Example runners add **extension** handlers (`webpage`, community node types) on top. See [Extending the builtin executor](./extending-builtin-executor.md).

```typescript
import { createBuiltinNodeExecutor } from "async-dag";
import { createNodeExecutor } from "./examples/lib/handlers/index.mjs"; // builtins + webpage + community

const engine = new GraphEngine({
  flow,
  llm: { provider: "bedrock", apiKey: "…", modelId: "…" },
  nodeExecutor: createNodeExecutor(),
});
```

## Local development (`.env`)

Example scripts load `.env` / `.env.bedrock` and map env vars to `llm`:

```bash
cp .env.bedrock.template .env.bedrock
# BEDROCK_API_KEY=…
npm run run:output-chaining
```

Helper: [`examples/lib/resolve-llm-from-env.mjs`](../examples/lib/resolve-llm-from-env.mjs) — same mapping for your own runners.

| Env variable | Maps to |
|--------------|---------|
| `BEDROCK_API_KEY` | `llm.provider: "bedrock"`, `apiKey` |
| `BEDROCK_REGION` | `region` |
| `BEDROCK_MODEL_ID` | `modelId` |
| `LLM_API_KEY` + `LLM_API_BASE` | `llm.provider: "openai"`, `apiKey`, `baseUrl` |
| `LLM_MODEL` | `model` |

Bedrock env wins when `BEDROCK_API_KEY` is set.

## `genText` prompt placeholders

`resolveGenTextQuery()` (exported from `async-dag`) substitutes upstream data into `data.nodeData`:

| Placeholder | Meaning |
|-------------|---------|
| `{$upstream}` | All fan-in sources joined |
| `{$source_1}`, `{$source_2}` | By dependency order |
| `{$ontario_gov}` | Upstream `outputTarget: "$ontario_gov"` |

See [Output chaining](./examples/output-chaining.md).

## Custom executor

If you use your own `nodeExecutor`, read merged settings from each node:

```typescript
nodeExecutor: async (node) => {
  const settings = node.data?.settings ?? {};
  const apiKey = settings.bedrockApiKey as string;
  const modelId = settings.modelId as string;
  // call your LLM
};
```

Or call `mergeLlmConfigIntoGlobalSettings()` yourself when building settings outside `GraphEngine`.

## Security

- Pass `llm.apiKey` from env vars or a secret manager in application code.
- Do **not** commit API keys into pipeline JSON or checked-in `globalSettings` files.
- See [Security policy](./security).

## Related

- [API reference](./api.md) — `GraphEngine` options and exports
- [Bring your own LLM](./byo-llm.md) — custom `nodeExecutor` path
- [Output chaining example](./examples/output-chaining.md) — fan-in → `genText`
