# `groupNode`

Generated local handler for pipelines exported from ArcPX.

| Field | Notes |
|-------|--------|
| `node.type` | `"groupNode"` |
| Kind | **container** |
| Handler | [`executor.example.mjs`](./executor.example.mjs) |

## Wire-up

Already registered in [`../registry.mjs`](../registry.mjs). Re-run:

```bash
npm run build
node examples/run-local.mjs ./your-pipeline.json
```

## `nodeData`

Usually only `data.label` — no `nodeData` required.

## Env vars (integration)

```bash
# TODO: MY_API_KEY=...
```
