# Markdown output (`markdownOutput`)

Leaf node for **fan-in**: merges upstream payloads (e.g. two `webpage` fetches) into one Markdown document.

| Field | Value |
|-------|--------|
| `node.type` | `markdownOutput` (aliases: `markdown`, `markdownReport`) |
| Handler | [`executor.example.mjs`](./executor.example.mjs) |

## `nodeData`

```json
{
  "title": "We are Canada",
  "intro": "Optional intro paragraph.",
  "outputPath": "./examples/output/we-are-canada.md"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `title` | no | H1 heading (defaults to node `label`) |
| `intro` | no | Text under the title |
| `outputPath` | no | `.md` file path (default: `examples/output/<slugified-title>.md`) |

**Always writes a file** — the leaf formats fan-in `sourceData`, renders Markdown (TOC, per-source tables, page content), and saves to disk.

## Upstream input

With two parents, the engine passes **`data.sourceData` as an array** (fan-in). Each `webpage` result should include `url`, `title`, `text`.

## Rendered file structure

- YAML front matter (`title`, `generatedAt`, `sourceCount`)
- Table of contents with anchor links
- Per upstream source: metadata table + **Page content** section
- Uses `label` from `webpage` nodes when present

## Return value

```json
{
  "format": "markdown",
  "rendered": true,
  "writtenTo": "/path/to/we-are-canada.md",
  "sourceCount": 2,
  "sources": [{ "heading": "Canada Government", "url": "https://..." }]
}
```

## Example pipeline

[`examples/pipeline-output-chaining.json`](../../pipeline-output-chaining.json)

```bash
npm run run:output-chaining
```
