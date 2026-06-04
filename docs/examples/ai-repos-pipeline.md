# AI repos pipeline (ArcPX-style)

**File:** [`examples/pipeline-ai-repos.normalized.json`](../../examples/pipeline-ai-repos.normalized.json)  
Derived from a real ArcPX export. Requires a custom `nodeExecutor` (and [BYO LLM](../byo-llm.md) for `genText`).

```mermaid
flowchart LR
  aiRepos["aiRepos_c2a16bc9…<br/>aiRepos<br/>GitHub companies"]
  pipeNode["pipeNode_333e619e…<br/>pipeNode<br/>$adaptive_json_agent"]
  genText["genText_0c2768cc…<br/>genText<br/>Strategic synthesis"]
  aiRepos --> pipeNode --> genText
```

Placeholder chain (`{$aiRepos}` → pipe → `{$adaptive_json_agent}` → genText):

```mermaid
flowchart TB
  aiRepos["aiRepos<br/>nodeData: company[], limit"]
  pipeNode["pipeNode<br/>JSON minify prompt<br/>{$aiRepos}"]
  genText["genText<br/>isPassThrough<br/>{$adaptive_json_agent}"]
  aiRepos -->|"sourceData"| pipeNode
  pipeNode -->|"sourceData + cells"| genText
```

## Nodes

### `aiRepos` (data source)

`data.nodeData` is an **object**:

```json
{
  "company": ["nvidia", "openai", "anthropic", "google-deepmind", "meta", "huggingface"],
  "limit": 2,
  "fetch_readme": false
}
```

### `pipeNode` (transform)

- `outputTarget`: `"$adaptive_json_agent"`
- `nodeData`: prompt template with `{$aiRepos}` placeholder

### `genText` (LLM)

- `isPassThrough`: `true`
- `nodeData`: prompt with `{$adaptive_json_agent}`
- Receives aggregated `sourceData` at run time

## Runtime

The engine augments each node with `data.sourceData` and `data.settings` before `nodeExecutor` runs. Implement `{$variable}` substitution and API/LLM calls in your handler.

[Payload guide](../payload-guide.md) · [Docs index](../README.md)
