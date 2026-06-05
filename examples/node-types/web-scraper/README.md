# Web scraper (`webpage`)

> **Extending the package builtin:** `webpage` is not in `createBuiltinNodeExecutor()` — register it in your composed `nodeExecutor`. Walkthrough: [docs/extending-builtin-executor.md](../../../docs/extending-builtin-executor.md).

Fetch a URL and return **title + plain text** (HTML stripped). Uses Node’s built-in `fetch` — no npm dependencies.

| Field | Value |
|-------|--------|
| `node.type` | `webpage` (also registered as `webScraper`) |
| Handler | [`executor.example.mjs`](./executor.example.mjs) |

## `nodeData`

```json
{
  "url": "https://example.com",
  "timeoutMs": 15000,
  "maxChars": 50000,
  "userAgent": "optional override"
}
```

| Field | Required | Default |
|-------|----------|---------|
| `url` | yes | — |
| `timeoutMs` | no | `15000` |
| `maxChars` | no | `50000` |
| `userAgent` | no | `WEB_SCRAPER_USER_AGENT` env or arc-dag default |

## Environment (optional)

```bash
# Optional custom User-Agent
export WEB_SCRAPER_USER_AGENT="MyBot/1.0"
```

## Return value

```json
{
  "url": "https://example.com",
  "finalUrl": "https://example.com/",
  "status": 200,
  "contentType": "text/html",
  "title": "Example Domain",
  "text": "Example Domain This domain is for use in illustrative examples...",
  "truncated": false,
  "length": 142
}
```

Downstream `pipeNode` / `genText` nodes receive this object in `data.sourceData`.

## Run the example pipeline

```bash
npm run run:web-scraper
```

## Security

- Only `http:` / `https:` URLs
- Respect `robots.txt` and site terms in production
- Do not scrape authenticated pages without explicit consent

See [SECURITY.md](../../SECURITY.md).
