# Bedrock LLM nodes (AWS Converse)

| `node.type` | Use case |
|-------------|----------|
| **`genText`** | **ArcPX export** — string `nodeData`, `isPassThrough`, `{$placeholders}` |
| **`LLM`** | Same Bedrock handler, explicit type name |

| Piece | Location |
|-------|----------|
| Handler | [`executor.example.mjs`](./executor.example.mjs) |
| Client | [`../../lib/bedrock-converse.mjs`](../../lib/bedrock-converse.mjs) |

## Environment (`.env.bedrock`)

```bash
cp .env.bedrock.template .env.bedrock
# edit .env.bedrock — set BEDROCK_API_KEY
```

| Variable | Required | Default |
|----------|----------|---------|
| `BEDROCK_API_KEY` | yes | — |
| `BEDROCK_REGION` | no | `us-east-1` |
| `BEDROCK_MODEL_ID` | no | `us.anthropic.claude-sonnet-4-6` |

Passed as `GraphEngine({ llm: { provider: "bedrock", apiKey, modelId, region } })` in app code. Example runners load `.env.bedrock` via [`resolve-llm-from-env.mjs`](../../lib/resolve-llm-from-env.mjs) — see [docs/llm-config.md](../../../docs/llm-config.md).

In production ArcPX, `get_service_key(userId, "bedrock")` resolves the key — locally use `.env.bedrock` or `nodeData.apiKey`.

## `genText` (ArcPX shape)

```json
{
  "type": "genText",
  "data": {
    "label": "We are Canada",
    "isPassThrough": true,
    "nodeData": "Write a report...\n\n{$upstream}",
    "settings": {
      "modelId": "us.anthropic.claude-sonnet-4-6",
      "region": "us-east-1",
      "outputPath": "./examples/output/we-are-canada.md"
    }
  }
}
```

Placeholders: `{$upstream}`, `{$source_1}`, `{$source_2}`, or upstream `outputTarget` names (e.g. `{$ontario_gov}` when parent has `"outputTarget": "$ontario_gov"`).

## `LLM` nodeData

String prompt or `{ "query": "...", "modelId": "..." }`.

## History

Upstream `genText` / chat nodes pass history via `data.sourceData`. Format supported:

```json
[{ "role": "user", "parts": [{ "text": "..." }] }, { "role": "model", "parts": [{ "text": "..." }] }]
```

Converted to Bedrock `user` / `assistant` + `content: [{ text }]`.

## Returns

Assistant text string (same as Python `gen()` return value).

## Run with a pipeline

Use [`examples/run-with-llm.mjs`](../../run-with-llm.mjs) — it handles `LLM` nodes via this handler when `BEDROCK_API_KEY` is set.

```bash
cp .env.bedrock.template .env.bedrock
# set BEDROCK_API_KEY in .env.bedrock
node examples/run-with-llm.mjs ./your-pipeline.json
```
