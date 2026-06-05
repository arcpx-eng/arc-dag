#!/usr/bin/env node
/**
 * Run a pipeline JSON file exported from arcpx.com locally with arc-dag.
 *
 * Usage:
 *   node examples/run-local.mjs ./pipeline.json
 *   node examples/run-local.mjs ./pipeline.json ./global-settings.json
 *
 * Handlers: examples/lib/handlers/ (core) + examples/node-types/registry.mjs (community)
 * Missing type? npm run generate:handler -- <nodeType>  (see docs/node-handlers.md)
 */

import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  GraphEngine,
  loadFlowFromFile,
  loadGlobalSettingsFromFile,
} from "../dist/index.js";
import {
  createLocalExecutor,
  clearDataFlowTrace,
} from "./lib/create-local-executor.mjs";
import {
  subscribeDataFlowTrace,
  shouldTraceDataFlow,
} from "./lib/flow-trace.mjs";
import {
  loadProjectEnv,
  formatEnvLoadReport,
} from "./lib/load-project-env.mjs";
import { resolveLlmFromEnv } from "./lib/resolve-llm-from-env.mjs";

async function main() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const envResult = loadProjectEnv(root);
  if (process.env.DEBUG_ENV) console.log(formatEnvLoadReport(envResult));

  const flowPath = process.argv[2];
  const settingsPath = process.argv[3];

  if (!flowPath) {
    console.error(
      "Usage: node examples/run-local.mjs <pipeline.json> [global-settings.json]",
    );
    process.exit(1);
  }

  const flow = await loadFlowFromFile(resolve(flowPath));
  const globalSettings = settingsPath
    ? await loadGlobalSettingsFromFile(resolve(settingsPath))
    : {};

  console.log(
    `Loaded flow: ${flow.nodes.length} nodes, ${flow.edges.length} edges`,
  );

  const traceDataFlow = shouldTraceDataFlow(flowPath);
  clearDataFlowTrace();

  const llm = resolveLlmFromEnv();

  const engine = new GraphEngine({
    flow,
    llm,
    globalSettings,
    nodeExecutor: createLocalExecutor({ traceDataFlow }),
  });

  engine.subscribe((event) => {
    if (event.type === "node:start") {
      console.log(`→ start ${event.nodeId}`);
    } else if (event.type === "node:complete") {
      console.log(`✓ complete ${event.nodeId}`);
    } else if (event.type === "node:error") {
      console.error(`✗ error ${event.nodeId}`, event.error);
    }
  });

  subscribeDataFlowTrace(engine, flowPath);

  const outputs = await engine.run();
  console.log("\nOutputs:");
  const summary = Object.fromEntries(
    [...outputs.entries()].map(([id, value]) => {
      if (
        value &&
        typeof value === "object" &&
        /** @type {Record<string, unknown>} */ (value).format === "markdown" &&
        /** @type {Record<string, unknown>} */ (value).writtenTo
      ) {
        const v = /** @type {Record<string, unknown>} */ (value);
        return [
          id,
          {
            format: "markdown",
            writtenTo: v.writtenTo,
            sourceCount: v.sourceCount,
            sources: v.sources,
            markdownPreview: String(v.markdown).slice(0, 240) + "…",
          },
        ];
      }
      return [id, value];
    }),
  );
  console.log(JSON.stringify(summary, null, 2));

  for (const value of outputs.values()) {
    if (
      value &&
      typeof value === "object" &&
      /** @type {Record<string, unknown>} */ (value).writtenTo
    ) {
      const path = /** @type {Record<string, unknown>} */ (value).writtenTo;
      console.log(`\n📄 Markdown report: ${path}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
