# API reference

Full LLM setup guide: [LLM configuration](./llm-config.md).

## `GraphEngine`

```typescript
import { GraphEngine, loadFlowFromFile } from "arc-dag";

const engine = new GraphEngine({
  flow,
  nodeExecutor,
  llm?: {
    provider: "bedrock" | "openai",
    apiKey: "...",
    modelId?: "...",      // bedrock
    region?: "us-east-1", // bedrock
    baseUrl?: "...",      // openai-compatible
    model?: "gpt-4o",
  },
  globalSettings?: {},
  initialOutputs?: {},
  aggregateSourceTypes?: ["genText", "pipeNode"],
});

await engine.run(); // Map<nodeId, output>
```

| Option | Description |
|--------|-------------|
| `flow` | `FlowDocument` — `{ nodes, edges, viewport? }` |
| `nodeExecutor` | `(node: FlowNode) => Promise<unknown>` |
| `llm` | LLM provider name + API key + model/region — merged into each node’s `data.settings` (preferred for secrets) |
| `globalSettings` | Additional run-time settings merged into each node’s `data.settings` (overrides `llm`) |
| `initialOutputs` | Pre-seed outputs by node id |
| `aggregateSourceTypes` | Node types that receive aggregated upstream `sourceData` |

### Methods

- `run()` — execute all nodes (dependencies first)
- `subscribe(handler)` — `node:start` \| `node:complete` \| `node:error`
- `getFlow()` — return the input document
- `getGraph()` — adjacency map of node id → children
- `getGlobalSettings()` — merged `llm` + `globalSettings` passed to nodes

## Utilities

| Export | Description |
|--------|-------------|
| `parseFlowJson` | Parse string or object |
| `parseAndNormalizeFlowJson` | Parse + strip canvas fields |
| `normalizeFlow` | Normalize a `FlowDocument` |
| `loadFlowFromFile` | Load pipeline JSON from disk |
| `loadGlobalSettingsFromFile` | Load settings JSON |
| `formatChatTurn` / `formatChatHistory` | Chat message shapes (OpenAI vs Gemini) |

## Types

Exported from `arc-dag`: `FlowDocument`, `FlowNode`, `FlowEdge`, `FlowNodeData`, `GraphEngineOptions`, `NodeExecutor`, `NodeEvent`, `LlmConfig`, `LlmProviderName`, `BedrockLlmConfig`, `OpenAiLlmConfig`, `createBuiltinNodeExecutor`, `resolveGenTextQuery`, `mergeLlmConfigIntoGlobalSettings`.

### Bedrock example

```typescript
import {
  GraphEngine,
  loadFlowFromFile,
  createBuiltinNodeExecutor,
} from "arc-dag";

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

### Extending with custom node types

`createBuiltinNodeExecutor()` does not include `webpage` or your own integrations. Compose a wrapper that tries custom handlers first, then delegates to the builtin.

See **[Extending the builtin executor](./extending-builtin-executor.md)** — full `webpage` walkthrough with TypeScript helper `extendBuiltinNodeExecutor`.

## Runtime fields on `node.data`

Before each `nodeExecutor` call, the engine sets:

- **`sourceData`** — upstream output(s)
- **`settings`** — merged global + per-node settings

See [Payload guide](./payload-guide.md).
