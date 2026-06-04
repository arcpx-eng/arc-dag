# `xApi` node type (example)

Reference handler for calling the **X (Twitter) API** from async-dag pipelines.

> Use official APIs and comply with [X developer terms](https://developer.x.com/). Rate limits and authentication are your responsibility.

## `node.data.nodeData` shape

```json
{
  "operation": "searchRecent",
  "query": "from:arcpx lang:en",
  "maxResults": 10
}
```

Supported operations in the stub (extend via PR):

| `operation` | Description |
|-------------|-------------|
| `searchRecent` | Recent search (API v2) |

## Environment

| Variable | Purpose |
|----------|---------|
| `X_API_BEARER_TOKEN` | OAuth 2.0 Bearer token for app-only requests |

## Executor

See [`executor.example.mjs`](./executor.example.mjs). PRs welcome for post tweet, user lookup, timelines, etc.

## Sample node

See [`node.sample.json`](./node.sample.json).
