# `aiRepos`

Generated local handler for pipelines exported from ArcPX.

| Field | Notes |
|-------|--------|
| `node.type` | `"aiRepos"` |
| Kind | **integration** |
| Handler | [`executor.example.mjs`](./executor.example.mjs) |

## Wire-up

Already registered in [`../registry.mjs`](../registry.mjs). Re-run:

```bash
npm run build
node examples/run-local.mjs ./your-pipeline.json
```

## `nodeData`

Document the shape of `data.nodeData` for your integration and add env vars below.

## Env vars (integration)

```bash
# TODO: MY_API_KEY=...
```
