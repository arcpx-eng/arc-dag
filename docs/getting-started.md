---
sidebar_position: 2
---

# Getting started

## Install

```bash
git clone https://github.com/arcpx-eng/async-dag.git
cd async-dag
npm install
npm run build
```

## Documentation site (maintainers, optional)

Not part of the npm package. From a git clone, with Node **>= 20**:

```bash
cd docs-site && npm install && npm start   # http://localhost:3000
```

**Node.js >= 18**

## Run an example (no API keys)

```bash
npm run quickstart          # 3-node linear
npm run run:fan-in          # 4-node fan-in
npm run run:fan-out         # 4-node fan-out
```

See [Scripts](./scripts.md) and [Example pipelines](./README.md#example-pipelines).

## TypeScript quick start

```typescript
import {
  GraphEngine,
  loadFlowFromFile,
  createBuiltinNodeExecutor,
} from "async-dag";

const flow = await loadFlowFromFile("./pipeline.json");

const engine = new GraphEngine({
  flow,
  llm: {
    provider: "bedrock",
    apiKey: process.env.BEDROCK_API_KEY!,
    modelId: "us.anthropic.claude-sonnet-4-6",
    region: "us-east-1",
  },
  globalSettings: {
    temperature: 0.5,
    systemPrompt: "You are a helpful assistant",
  },
  nodeExecutor: createBuiltinNodeExecutor(),
});

const outputs = await engine.run();
console.log(Object.fromEntries(outputs));
```

See [LLM configuration](./llm-config.md) for OpenAI-compatible providers and all options. Custom handlers: [BYO LLM](./byo-llm.md).

## Project layout

```
async-dag/
├── src/                 # Library (GraphEngine, parsers)
├── docs/                # Documentation
├── examples/            # Pipelines + runners
├── .env.template        # OpenAI-compatible LLM → copy to .env
├── .env.bedrock.template # Bedrock (node.type LLM) → copy to .env.bedrock
└── dist/                # Build output
```

## Next steps

- [Payload guide](./payload-guide.md) — JSON format and normalization
- [Bring your own LLM](./byo-llm.md) — real `genText` / chat nodes
- [ArcPX integration](./arcpx-integration.md) — design on arcpx.com, export JSON
- [Node handlers](./node-handlers.md) — fix “No local handler for …” stubs
