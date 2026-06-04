---
title: Contributing
---

# Contributing to async-dag

Thank you for your interest in contributing. async-dag is the **open-source core engine of ArcPX** — we welcome improvements to the library and **community node type examples** that help others build custom wrappers.

## Getting started

```bash
git clone https://github.com/arcpx-eng/async-dag.git
cd async-dag
npm install          # only TypeScript + @types/node — not the docs site
npm run build
npm run run:local
```

**Docs site (optional):** `cd docs-site && npm install && npm start` — VitePress lives only in `docs-site/` and is **not** published with the `async-dag` npm package.

## Pull requests welcome: new node types

The engine stays small and **pluggable**. The best way to share integrations is to add a **reference node type** under [`examples/node-types/`](./examples/node-types/).

### Ideas we encourage

- **`bigQuery`** — query Google BigQuery ([starter stub](./examples/node-types/bigquery/))
- **`xApi`** — X (Twitter) platform API ([starter stub](./examples/node-types/x-api/))
- Slack, Postgres, S3, webhooks, email, CRMs, vector DBs, etc.

### What to include in your PR

1. Folder: `examples/node-types/<type-name>/`
2. **`README.md`** in your node folder + links from [`docs/`](./docs/) where relevant (`payload-guide`, `byo-llm`, `api`)
3. **`executor.example.mjs`** — handler users can copy into `nodeExecutor`
4. **`node.sample.json`** (optional) — sample `FlowNode` for documentation
5. Row in [`examples/node-types/README.md`](./examples/node-types/README.md) index table

### Node type PR rules

- **No API keys or tokens** in committed files — env vars only
- **No new required dependencies** on the core `async-dag` package — document optional installs in your README
- Keep handlers **focused** — one node type per folder; large platforms can split operations in README tables
- Prefer **fetch** or document optional SDKs clearly
- Mention rate limits, auth, and platform ToS where relevant

### Example commit titles

- `feat(examples): add bigQuery node type with service account docs`
- `feat(examples): xApi searchRecent handler and sample node`
- `docs: index postgres node type in node-types README`

## Other contributions

| Area | Examples |
|------|----------|
| **Core engine** | Scheduling, dependency edge cases, performance |
| **Payload tooling** | `normalizeFlow`, parsers, validation |
| **Documentation** | `docs/`, root README links |
| **Examples** | Normalized pipeline samples, runner improvements |

Out of scope for this repo:

- Bundling a full node catalog into core async-dag (stays pluggable via `nodeExecutor`)
- ArcPX cloud / Lambda / CDK (see arcpx-infra)
- Full canvas UI (see [async-dag-ui skill](./.cursor/skills/async-dag-ui/SKILL.md))

## Pull request guidelines

1. **One concern per PR** — bugfix, engine change, or node-type example; avoid mixing.
2. **Build must pass:** `npm run build`
3. **Document changes** — README, `docs/`, `examples/node-types/`, or CHANGELOG.
4. **No secrets** — never commit credentials in JSON or code.
5. **License** — contributions are under the project [MIT License](./LICENSE).

## Code style

- TypeScript strict mode for `src/`; match existing layout
- Example handlers in `examples/` may use `.mjs` and dynamic import for optional SDKs
- Public API changes must update `src/index.ts` and [API reference](./api)

## Questions

Open a [GitHub issue](https://github.com/arcpx-eng/async-dag/issues) for bugs, node-type proposals, or design discussion before a large PR.
