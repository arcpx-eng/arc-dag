---
title: Changelog
---

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- `run()` executes every node in the pipeline (removed `selectedNodeIds` — ArcPX canvas-only feature)

### Added

- `GraphEngine({ llm })` — typed LLM provider config (`bedrock` \| `openai`), API key, model/region merged into `node.data.settings`
- `createBuiltinNodeExecutor()`, `resolveGenTextQuery()`, `mergeLlmConfigIntoGlobalSettings()` exported from package
- [LLM configuration](./llm-config) — LLM configuration guide
- [Extending builtin executor](./extending-builtin-executor) — custom node types + `webpage` on `createBuiltinNodeExecutor`
- Example helper `resolveLlmFromEnv()`; runners pass `llm` from `.env` / `.env.bedrock`
- Unit tests for `llm` config, env resolution, builtin executor, output chaining
- Open-source release of the ArcPX core DAG engine (`GraphEngine`)
- `GraphEngine` — DAG execution with dependency-aware parallelism
- Pipeline graph JSON input (`FlowDocument`, `FlowNode`, `FlowEdge`)
- `normalizeFlow`, `parseAndNormalizeFlowJson`, file loaders
- Chat payload formatters (`formatChatTurn`, `formatChatHistory`)
- Documentation: payload guide, UI synthesis skill, examples
- Local runner and normalize CLI scripts

## [0.1.0] - 2026-06-03

### Added

- Initial public release

[Unreleased]: https://github.com/arcpx-eng/async-dag/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/arcpx-eng/async-dag/releases/tag/v0.1.0
