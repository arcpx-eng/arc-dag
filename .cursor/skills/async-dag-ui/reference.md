# async-dag payload reference

Canonical walkthrough with a real multi-node export: [`docs/payload-guide.md`](../../../docs/payload-guide.md).  
Normalized example: [`examples/pipeline-ai-repos.normalized.json`](../../../examples/pipeline-ai-repos.normalized.json).

## Normalize exports

```typescript
import { parseAndNormalizeFlowJson, normalizeFlow } from "async-dag";

const flow = parseAndNormalizeFlowJson(raw, { stripSourceData: true, stripOutputs: true });
```

Strips canvas fields (`measured`, `selected`, edge `style`, etc.) and runtime `data.sourceData`.

## FlowDocument

| Field | Required | Notes |
|-------|----------|-------|
| `nodes` | yes | Array of graph nodes |
| `edges` | yes | `source` / `target` = node `id` |
| `viewport` | no | Pan/zoom; ignored by engine |

## FlowNode (each item in `nodes`)

| Field | Required | Notes |
|-------|----------|-------|
| `id` | yes | Unique; edges reference this |
| `type` | yes | Executor dispatch key |
| `position` | yes | `{ x, y }` — UI layout only |
| `data` | no | Config + runtime fields (see below) |

### Common `data` fields (conventions)

| Key | Set by | Purpose |
|-----|--------|---------|
| `label` | UI | Display name |
| `nodeData` | UI | Primary input (prompt, URL, text) |
| `nodeOutput` | UI or run | Cached output; seeds `initialOutputs` |
| `outputTarget` | UI | pipeNode variable name (e.g. `$adaptive_json_agent`) for `{$name}` in prompts |
| `settings` | UI | Per-node overrides (model, temperature) |
| `isPassThrough` | UI | When true, dependency walk includes upstream chain (chat branches) |
| `sourceData` | **Engine** | Upstream outputs at execution time |
| `settings` (merged) | **Engine** | `globalSettings` + per-node settings at execution time |

Your UI should persist everything the executor needs except `sourceData` (computed at run).

## FlowEdge

| Field | Required |
|-------|----------|
| `id` | recommended |
| `source` | yes |
| `target` | yes |

`type`, `style`, `animated` are UI-only.

## globalSettings (run-time, not in flow file)

Passed to `GraphEngine({ globalSettings })`. Typical LLM fields:

```json
{
  "serviceMode": "built-in",
  "model": "gpt-4o",
  "temperature": 0.5,
  "maxOutputTokens": 4096,
  "systemPrompt": "You are a helpful assistant"
}
```

Map `serviceMode` to your LLM client (e.g. `"built-in"` → OpenAI chat format). Use env vars for API keys.

## Aggregate dependency behavior

Default `aggregateSourceTypes`: `genText`, `pipeNode`, plus **leaf** nodes (no outgoing edges).

- Aggregating nodes receive `data.sourceData` as an **array** of upstream outputs.
- Others receive a **single** parent output (`meta.dependencies[0]`).

Override with `aggregateSourceTypes` if your graph uses different type names.

## Wrapper JSON (file loaders)

`parseFlowJson` also accepts:

```json
{ "node_data": { "nodes": [], "edges": [] } }
```

```json
{ "flow": { "nodes": [], "edges": [] }, "globalSettings": {} }
```

## Minimal valid export

```json
{
  "nodes": [
    {
      "id": "llm_1",
      "type": "llm",
      "position": { "x": 0, "y": 0 },
      "data": { "nodeData": "Summarize the input" }
    }
  ],
  "edges": []
}
```

## Schema example for dynamic forms

```typescript
type FieldSchema =
  | { kind: "text"; key: string; label: string; multiline?: boolean }
  | { kind: "number"; key: string; label: string; min?: number; max?: number }
  | { kind: "select"; key: string; label: string; options: string[] };

const registry: NodeDefinition[] = [
  {
    type: "llm",
    label: "LLM",
    category: "AI",
    fields: [
      { kind: "text", key: "nodeData", label: "Prompt", multiline: true },
    ],
  },
  {
    type: "http",
    label: "HTTP GET",
    category: "Data",
    fields: [
      { kind: "text", key: "nodeData", label: "URL" },
    ],
  },
];
```

Default `data` for a new node:

```typescript
function defaultData(def: NodeDefinition): Record<string, unknown> {
  const data: Record<string, unknown> = { label: def.label };
  for (const f of def.fields) data[f.key] = f.kind === "number" ? 0 : "";
  return data;
}
```

## Executor skeleton

```typescript
import type { FlowNode } from "async-dag";

export function createExecutor(deps: { llm: YourLlmClient }) {
  return async (node: FlowNode) => {
    switch (node.type) {
      case "llm": {
        const prompt = String(node.data?.nodeData ?? "");
        const history = node.data?.sourceData;
        const settings = node.data?.settings ?? {};
        return deps.llm.complete({
          model: settings.model,
          system: settings.systemPrompt,
          prompt,
          history,
        });
      }
      default:
        throw new Error(`Unknown type: ${node.type}`);
    }
  };
}
```
