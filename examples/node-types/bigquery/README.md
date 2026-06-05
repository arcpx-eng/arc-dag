# `bigQuery` node type (example)

Reference handler for running SQL against **Google BigQuery** from arc-dag.

## `node.data.nodeData` shape

```json
{
  "projectId": "my-gcp-project",
  "query": "SELECT id, name FROM `dataset.table` LIMIT 10",
  "location": "US",
  "maximumBytesBilled": "1000000000"
}
```

## Environment

| Variable | Purpose |
|----------|---------|
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to service account JSON (local dev) |
| Or ADC | Workload identity / `gcloud auth application-default login` on your machine |

Install the client in **your** app (not required by arc-dag core):

```bash
npm install @google-cloud/bigquery
```

## Executor

See [`executor.example.mjs`](./executor.example.mjs). Expand and open a PR with real error handling, parameterized queries, or dry-run mode.

## Sample node

See [`node.sample.json`](./node.sample.json).
