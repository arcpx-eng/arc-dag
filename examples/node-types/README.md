# Community node types

**Pull requests welcome.** Share reference implementations for new `node.type` handlers that others can copy into their `nodeExecutor` or wrapper apps.

**ArcPX core types** (`pipeNode`, `genText`, `webpage`, …) live in [`../lib/handlers/`](../lib/handlers/) — see [docs/core-node-types.md](../../docs/core-node-types.md).

This folder is for **community & custom** node types. Keep examples dependency-light and document required env vars.

## Generate a local handler (your machine)

```bash
npm run generate:handler
```

Interactive wizard — see [docs/node-handlers.md](../../docs/node-handlers.md).

## How to add a node type (PR checklist)

1. Create a folder: `examples/node-types/<your-type>/` (or use `generate:handler` above)
2. Include:
   - **`README.md`** — what the node does, `nodeData` shape, env vars, links to official API docs
   - **`executor.example.mjs`** — handler snippet wired for `examples/run-local.mjs` style
   - **`node.sample.json`** (optional) — minimal `FlowNode` fragment for docs
3. **No secrets** — use `process.env.*` placeholders only
4. **No heavy SDKs in core** — optional `peerDependencies` note in README if users should `npm install` separately
5. Update this index table in your PR

## Node types we’d love to see

| Idea | `node.type` (suggested) | Notes |
|------|-------------------------|--------|
| Google BigQuery | `bigQuery` | SQL / parameterized queries, service account or ADC |
| X (Twitter) API | `xApi` | Posts, search, timelines — respect platform ToS & rate limits |
| Slack | `slack` | Post message, read channel |
| S3 / GCS | `objectStorage` | Get/put objects |
| Postgres | `postgres` | Parameterized queries |
| Webhook | `webhook` | HTTP POST downstream output |
| Email | `email` | Send via SMTP or provider API |

Already started (expand via PR):

- [`bigquery/`](./bigquery/) — query BigQuery
- [`x-api/`](./x-api/) — X platform API
- [`web-scraper/`](./web-scraper/) — fetch URL, extract plain text (`webpage` node type)
- [`markdown-output/`](./markdown-output/) — fan-in leaf → combined Markdown (`markdownOutput`)
- [`llm-bedrock/`](./llm-bedrock/) — AWS Bedrock Converse (`LLM`)

## Wire into your runner

```javascript
import { createBigQueryHandler } from "./node-types/bigquery/executor.example.mjs";
import { createXApiHandler } from "./node-types/x-api/executor.example.mjs";

function createExecutor() {
  const bigQuery = createBigQueryHandler();
  const xApi = createXApiHandler();

  return async (node) => {
    switch (node.type) {
      case "bigQuery":
        return bigQuery(node);
      case "xApi":
        return xApi(node);
      // ...your other types
      default:
        throw new Error(`Unknown type: ${node.type}`);
    }
  };
}
```

Open a PR against [arcpx-eng/async-dag](https://github.com/arcpx-eng/async-dag) with the label **node-type** (if available) or mention it in the description.
