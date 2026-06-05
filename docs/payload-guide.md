# Pipeline payload guide

This document describes the **input JSON** arc-dag expects, how to **normalize** a raw canvas export, and a **real-world example** (AI repos → JSON transform → LLM synthesis).

## Top-level shape

```json
{
  "nodes": [ /* FlowNode[] */ ],
  "edges": [ /* FlowEdge[] */ ],
  "viewport": { "x": 0, "y": 0, "zoom": 1 }
}
```

| Field | Required | Used by engine |
|-------|----------|----------------|
| `nodes` | yes | yes |
| `edges` | yes | yes |
| `viewport` | no | no (layout only) |

## Raw export vs normalized payload

Canvas apps (including ArcPX) often export **extra UI state**. Normalize before git, docs, or a clean re-run.

| On node (removed when normalized) | Purpose |
|-----------------------------------|---------|
| `measured`, `width`, `height` | Layout |
| `selected`, `dragging`, `className` | Editor state |

| On edge (removed) | Purpose |
|---------------------|---------|
| `animated`, `style`, `selected` | Editor chrome |

| On `data` (removed by default) | Purpose |
|----------------------------------|---------|
| `sourceData` | Filled at **run time** by GraphEngine — do not persist |
| `id` (duplicate of node `id`) | Redundant |
| `nodeOutput` | Optional cache from a previous run — strip with `--strip-outputs` for fresh execution |

### Normalize in code

```typescript
import { parseFlowJson, normalizeFlow, parseAndNormalizeFlowJson } from "arc-dag";

const flow = parseAndNormalizeFlowJson(exportedJson, {
  stripSourceData: true,
  stripOutputs: true,   // fresh run
  dedupeDataId: true,
});
```

### Normalize from CLI

```bash
node examples/normalize-pipeline.mjs ./pipeline.json ./pipeline.normalized.json
node examples/normalize-pipeline.mjs ./pipeline.json ./out.json --strip-outputs
```

## Example pipelines

Walkthroughs with diagrams and runnable JSON:

| Pattern | Doc |
|---------|-----|
| Linear (3 nodes) | [examples/linear-pipeline.md](./examples/linear-pipeline.md) |
| Fan-in (4 nodes) | [examples/fan-in.md](./examples/fan-in.md) |
| Fan-out (4 nodes) | [examples/fan-out.md](./examples/fan-out.md) |
| ArcPX AI repos | [examples/ai-repos-pipeline.md](./examples/ai-repos-pipeline.md) |

## What the executor sees at runtime

For each node, GraphEngine calls `nodeExecutor(node)` with `data` augmented:

```typescript
{
  ...node.data,
  settings: { /* globalSettings + per-node overrides */ },
  sourceData: /* upstream output(s) */
}
```

### Example: `genText` during run

```json
{
  "label": "Chat",
  "nodeData": "System Prompt: ...\n\nHere is the input JSON:\n{$adaptive_json_agent}",
  "isPassThrough": true,
  "settings": {
    "model": "gpt-4o",
    "temperature": 0.5,
    "systemPrompt": "..."
  },
  "sourceData": [
    {
      "type": "pipeNode",
      "data": [/* chat turns or pipe output */]
    }
  ]
}
```

Implement substitution of `{$variable}` and LLM calls in **your** executor — arc-dag only schedules the DAG.

## `nodeData` types

| `node.type` | Typical `data.nodeData` |
|-------------|-------------------------|
| `aiRepos`, `rssStatus`, `webpage`, … | **object** — service parameters |
| `pipeNode`, `genText`, `text` | **string** — prompt or text |
| `pipeNode` | also `outputTarget` for variable naming |

## Global settings (separate file)

Not included in the pipeline JSON export. Pass at run time:

```json
{
  "model": "gpt-4o",
  "temperature": 0.5,
  "maxOutputTokens": 8192,
  "systemPrompt": "You are a helpful assistant",
  "serviceMode": "built-in"
}
```

```typescript
const engine = new GraphEngine({
  flow: await loadFlowFromFile("./pipeline.normalized.json", { stripSourceData: true }),
  llm: {
    provider: "bedrock",
    apiKey: process.env.BEDROCK_API_KEY!,
    modelId: "us.anthropic.claude-sonnet-4-6",
  },
  globalSettings: await loadGlobalSettingsFromFile("./global-settings.json"),
  nodeExecutor: myExecutor,
});
```

API keys belong in `llm` (or env), not in pipeline JSON — see [LLM configuration](./llm-config.md).

## Minimal neutral template

Copy when defining your own graphs without a UI:

```json
{
  "nodes": [
    {
      "id": "source_1",
      "type": "fetch",
      "data": { "label": "Source", "nodeData": { "url": "https://api.example.com" } }
    },
    {
      "id": "llm_1",
      "type": "llm",
      "data": { "label": "Analyze", "nodeData": "Summarize: {$source_1}" }
    }
  ],
  "edges": [
    { "id": "e1", "source": "source_1", "target": "llm_1" }
  ]
}
```

## Checklist before `engine.run()`

- [ ] Every `edge.source` / `edge.target` matches a node `id`
- [ ] No `data.sourceData` in committed JSON (runtime only)
- [ ] `nodeExecutor` implements every `node.type` in the graph — see [Node handlers](./node-handlers.md) and `npm run generate:handler -- <type>`
- [ ] LLM credentials via env / config, not in JSON
- [ ] Optional: run `normalize-pipeline.mjs` on raw downloads

## See also

- [Documentation index](./README.md)
- [Bring your own LLM](./byo-llm.md)
- [API reference](./api.md)
- [Skill: arc-dag-ui](../.cursor/skills/arc-dag-ui/SKILL.md)
