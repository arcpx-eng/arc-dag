# ArcPX integration

[ArcPX](https://arcpx.com) is the full product UI built on the same engine as **arc-dag**. You can use both:

| Tool | Role |
|------|------|
| **arcpx.com** | Visual DAG editor, save/download pipelines |
| **arc-dag** | Run pipelines locally with your `nodeExecutor` and LLM |

## Export from ArcPX

1. Build the graph on [arcpx.com](https://arcpx.com)
2. Toolbar → **Download** → `pipeline.json` (`nodes` + `edges`)
3. Optionally copy **global settings** from the settings modal to a separate JSON file
4. Normalize if needed, then run:

```bash
node examples/normalize-pipeline.mjs ./pipeline.json ./pipeline.normalized.json --strip-outputs
node examples/run-local.mjs ./pipeline.normalized.json
```

Unknown `node.type`? See [Node handlers](./node-handlers.md) and `npm run generate:handler -- <type>`.

**Upload** on the ArcPX canvas accepts the same JSON for round-trip editing.

## Accepted JSON shapes

`parseFlowJson` accepts:

| Source | Shape |
|--------|--------|
| Editor download | `{ nodes, edges }` |
| Save API | `{ node_data: { nodes, edges } }` |
| Local bundle | `{ flow: { ... }, globalSettings: { ... } }` |

Details: [Payload guide](./payload-guide.md).
