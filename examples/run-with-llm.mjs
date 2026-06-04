#!/usr/bin/env node
/**
 * Run a pipeline with core ArcPX handlers (genText, pipeNode, webpage, …).
 *
 * Credentials: GraphEngine `llm` from .env / .env.bedrock (see docs/llm-config.md).
 *
 * Usage:
 *   node examples/run-with-llm.mjs ./pipeline.json
 *   node examples/run-with-llm.mjs ./pipeline.json ./global-settings.json
 */

import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  GraphEngine,
  loadFlowFromFile,
  loadGlobalSettingsFromFile,
} from "../dist/index.js";
import { createNodeExecutor } from "./lib/handlers/index.mjs";
import {
  loadProjectEnv,
  formatEnvLoadReport,
} from "./lib/load-project-env.mjs";
import { resolveLlmFromEnv } from "./lib/resolve-llm-from-env.mjs";

async function main() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const envResult = loadProjectEnv(root);
  console.log(formatEnvLoadReport(envResult));

  const llm = resolveLlmFromEnv();
  if (!llm) {
    console.warn(
      `\nNo LLM credentials — set BEDROCK_API_KEY (.env.bedrock) or LLM_API_* (.env).\nSee docs/llm-config.md\n`,
    );
  } else {
    console.log(`LLM provider: ${llm.provider}`);
  }

  const flowPath = process.argv[2];
  const settingsPath =
    process.argv[3] ?? resolve(root, "examples/global-settings.example.json");

  if (!flowPath) {
    console.error(
      "Usage: node examples/run-with-llm.mjs <pipeline.json> [global-settings.json]",
    );
    process.exit(1);
  }

  const flow = await loadFlowFromFile(resolve(flowPath));
  const globalSettings = await loadGlobalSettingsFromFile(
    resolve(settingsPath),
  );

  console.log(
    `Loaded flow: ${flow.nodes.length} nodes, model: ${globalSettings.model ?? llm?.modelId ?? llm?.model ?? process.env.LLM_MODEL ?? "?"}`,
  );

  const engine = new GraphEngine({
    flow,
    llm,
    globalSettings,
    nodeExecutor: createNodeExecutor(),
  });

  engine.subscribe((event) => {
    if (event.type === "node:start") console.log(`→ start ${event.nodeId}`);
    else if (event.type === "node:complete")
      console.log(`✓ complete ${event.nodeId}`);
    else if (event.type === "node:error")
      console.error(`✗ ${event.nodeId}`, event.error);
  });

  const outputs = await engine.run();
  console.log("\nOutputs:");
  const summary = Object.fromEntries(
    [...outputs.entries()].map(([id, value]) => {
      if (
        value &&
        typeof value === "object" &&
        "writtenTo" in /** @type {object} */ (value)
      ) {
        const v = /** @type {Record<string, unknown>} */ (value);
        return [
          id,
          {
            text: String(v.text).slice(0, 200) + "…",
            writtenTo: v.writtenTo,
          },
        ];
      }
      if (typeof value === "string" && value.length > 300) {
        return [id, value.slice(0, 300) + "…"];
      }
      return [id, value];
    }),
  );
  console.log(JSON.stringify(summary, null, 2));

  for (const value of outputs.values()) {
    if (
      value &&
      typeof value === "object" &&
      "writtenTo" in /** @type {object} */ (value)
    ) {
      console.log(
        `\n📄 Report: ${/** @type {Record<string, unknown>} */ (value).writtenTo}`,
      );
    }
  }
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
