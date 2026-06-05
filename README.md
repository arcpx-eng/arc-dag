<p align="center">
  <img src="./arcpx-logo.svg" alt="arc-dag logo" width="140" />
</p>

<h1 align="center">arc-dag</h1>

<p align="center">
  <strong>The open-source core engine of <a href="https://arcpx.com">ArcPX</a></strong><br />
  Pluggable · wrap with any UI · easy runner · parallel execution
</p>

<p align="center">
  Build your own wrapper — <strong>nodes</strong>, <strong>workflows</strong>, <strong>automation</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/arc-dag"><img src="https://img.shields.io/npm/v/arc-dag.svg" alt="npm version" /></a>
  <a href="https://arcpx-eng.github.io/arc-dag/"><img src="https://img.shields.io/badge/docs-GitHub%20Pages-2ea44f" alt="Documentation" /></a>
  <a href="https://github.com/arcpx-eng/arc-dag/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT" /></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js&logoColor=white" alt="Node.js >= 18" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" alt="TypeScript" /></a>
</p>

---

**arc-dag** is the **core DAG engine inside [ArcPX](https://arcpx.com)** — open source so you can embed the same runner in your own product, script, or platform.

| | |
|---|---|
| **Pluggable** | One `nodeExecutor` — your handlers, models, backends |
| **Wrap with any UI** | Any editor that exports `{ nodes, edges }` |
| **Easy runner** | `GraphEngine` + pipeline JSON + `await engine.run()` |
| **Parallel execution** | Independent branches run concurrently |

- **Nodes** — `node.type` in `nodeExecutor`
- **Workflows** — pipeline JSON you can version and diff
- **Automation** — CI, cron, CLI, your app — local-first

## Install

```bash
npm install arc-dag
```

```ts
import {
  GraphEngine,
  createBuiltinNodeExecutor,
  loadFlowFromFile,
} from "arc-dag";

// Example `nodes` + `edges` live in the GitHub repo (not in the npm tarball):
//   examples/quickstart-pipeline.json      — linear 3-node demo (npm run quickstart)
//   examples/fan-in-pipeline.json          — docs/examples/fan-in.md
//   examples/pipeline-output-chaining.json — docs/examples/output-chaining.md
// Overview + Mermaid diagrams: docs/examples/README.md
const flow = await loadFlowFromFile("./examples/quickstart-pipeline.json");

const engine = new GraphEngine({
  flow, // { nodes, edges } loaded from the JSON above
  nodeExecutor: createBuiltinNodeExecutor(),
});

await engine.run();
```

Pass LLM credentials at runtime (never in pipeline JSON):

```ts
import { GraphEngine, createBuiltinNodeExecutor } from "arc-dag";

// `flow` from loadFlowFromFile(...) — e.g. examples/pipeline-output-chaining.json
const engine = new GraphEngine({
  flow,
  nodeExecutor: createBuiltinNodeExecutor(),
  llm: {
    provider: "bedrock",
    apiKey: process.env.BEDROCK_API_KEY!,
    modelId: "us.anthropic.claude-sonnet-4-6",
    region: "us-east-1",
  },
});
```

## Try the full repo (examples & scripts)

```bash
git clone https://github.com/arcpx-eng/arc-dag.git && cd arc-dag && npm install && npm run build
npm run quickstart
```

The npm package ships **only** compiled `dist/`, this README, LICENSE, and logo — no examples, tests, or env files.

## Documentation

**[https://arcpx-eng.github.io/arc-dag/](https://arcpx-eng.github.io/arc-dag/)** — full docs site (GitHub Pages, Mermaid diagrams, examples).

| Topic | Link |
|-------|------|
| Getting started | [getting-started](https://arcpx-eng.github.io/arc-dag/getting-started) |
| API reference | [api](https://arcpx-eng.github.io/arc-dag/api) |
| LLM config (`GraphEngine({ llm })`) | [llm-config](https://arcpx-eng.github.io/arc-dag/llm-config) |
| All examples | [examples](https://arcpx-eng.github.io/arc-dag/examples/) |
| Extend builtin executor | [extending-builtin-executor](https://arcpx-eng.github.io/arc-dag/extending-builtin-executor) |

Source markdown is in [`docs/`](https://github.com/arcpx-eng/arc-dag/tree/main/docs). Local preview: `cd docs-site && npm install && npm start` → http://localhost:3000

## Contributing

PRs welcome — especially [community node types](https://github.com/arcpx-eng/arc-dag/tree/main/examples/node-types). See [CONTRIBUTING.md](https://github.com/arcpx-eng/arc-dag/blob/main/CONTRIBUTING.md).

## License

[MIT](https://github.com/arcpx-eng/arc-dag/blob/main/LICENSE) © [ArcPX Engineering](https://github.com/arcpx-eng) · [CHANGELOG](https://github.com/arcpx-eng/arc-dag/blob/main/CHANGELOG.md) · [SECURITY](https://github.com/arcpx-eng/arc-dag/blob/main/SECURITY.md)
