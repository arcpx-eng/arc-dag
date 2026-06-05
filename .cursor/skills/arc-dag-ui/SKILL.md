---
name: arc-dag-ui
description: >-
  Designs DAG canvas UIs that wrap the pluggable arc-dag GraphEngine — export pipeline
  JSON, easy local runs, parallel execution. Use when building pipeline editors or
  nodeExecutor handlers.
---

# arc-dag DAG UI synthesis

arc-dag is the **open-source core engine of ArcPX** — pluggable, easy to run, parallel by default. Help the user **wrap it** with their own UI and **`nodeExecutor`** for custom nodes, workflows, and automation. Export a **`FlowDocument`** (`nodes` + `edges`).

## Contract (non-negotiable)

Graph input must serialize to:

```json
{
  "nodes": [{ "id": "...", "type": "yourType", "position": { "x": 0, "y": 0 }, "data": { } }],
  "edges": [{ "id": "...", "source": "...", "target": "..." }],
  "viewport": { "x": 0, "y": 0, "zoom": 1 }
}
```

- **`type`** — stable string key; `nodeExecutor` switches on this.
- **`data`** — per-node config the UI collects (prompts, URLs, flags). Use **`nodeData`** for primary user input text when mirroring ArcPX-style graphs.
- **`globalSettings`** (separate object at run time) — model name, temperature, system prompt, API keys via env (never commit secrets into JSON).

Validate with `parseFlowJson` from `arc-dag` before run.

Full field reference: [reference.md](reference.md).

## Dynamic UI (preferred approach)

Build the editor so **node types are data-driven**, not hard-coded screens:

1. **Node registry** — map `type` → metadata:

   ```typescript
   type NodeDefinition = {
     type: string;
     label: string;
     category: string;
     isPassThrough?: boolean;
     fields: FieldSchema[];  // drives the inspector form
   };
   ```

2. **Schema-driven inspector** — one panel renders `fields` (text, number, select, json, code). Adding a node type = adding a registry entry, not a new page.

3. **Palette / drag-drop** — clone a template node: `{ id: uuid(), type, position, data: defaultDataFromSchema(def) }`.

4. **Live export** — on Save / Run, serialize `{ nodes, edges }` (and optional `viewport`) from your graph store. That object **is** the arc-dag input.

5. **Type-safe executor map** — `Record<string, NodeHandler>` keyed by `type`; LLM nodes read `node.data.nodeData`, `node.data.sourceData`, `node.data.settings`.

## LLM nodes (BYO service)

In `nodeExecutor` for types like `genText` / `llm` / `chat`, wire the LLM stack you want:

- Read `node.data.nodeData` (user prompt), `node.data.sourceData` (upstream), `node.data.settings` (model, temperature, systemPrompt).
- Call OpenAI, Anthropic, Gemini, Ollama, etc. from **user-provided** SDK/config.
- Return a string or structured object; engine stores it as that node's output.

Use `formatChatTurn` / `formatChatHistory` from `arc-dag` only if you adopt OpenAI vs Gemini message shapes.

## Implementation checklist

```
UI synthesis:
- [ ] Registry defines all node types and form schemas
- [ ] Canvas supports connect, delete, select, pan/zoom
- [ ] Export produces nodes[] + edges[] (ids stable, edges reference node ids)
- [ ] Optional: import/export JSON file round-trip

Runtime:
- [ ] parseFlowJson(export) succeeds
- [ ] nodeExecutor handles every type in the graph
- [ ] globalSettings passed to GraphEngine
- [ ] LLM keys from env / local config, not committed JSON
```

## Stack options

| Approach | Export path |
|----------|-------------|
| Custom canvas / SVG | Build `nodes`/`edges` arrays in your store |
| Any graph library | Adapter maps native graph → `FlowDocument` shape |
| ArcPX | Download `pipeline.json` from [arcpx.com](https://arcpx.com) |

ArcPX is a **reference** dynamic UI. You are **not** required to use it.

## Run exported JSON

```bash
node examples/run-local.mjs ./pipeline.json ./global-settings.json
```

Programmatic:

```typescript
import { GraphEngine, loadFlowFromFile } from "arc-dag";

const flow = await loadFlowFromFile("./pipeline.json");
const engine = new GraphEngine({ flow, globalSettings, nodeExecutor: myExecutor });
await engine.run();
```

## Anti-patterns

- Embedding API keys in `node.data` or exported JSON
- Executor logic inside the UI bundle without a clear `type` → handler map
- Changing `id` on export (breaks edges)
- UI-only fields required at runtime (strip `selected`, `dragging`, `measured` before run if desired — engine ignores them)

## Additional resources

- Payload and `node.data` conventions: [reference.md](reference.md)
- Engine API: [docs/api.md](../../../docs/api.md) · [docs/README.md](../../../docs/README.md)
