#!/usr/bin/env node
/**
 * Normalize a raw canvas export for arc-dag / git / docs.
 *
 * Usage:
 *   node examples/normalize-pipeline.mjs ./pipeline.json
 *   node examples/normalize-pipeline.mjs ./pipeline.json ./pipeline.normalized.json
 *   node examples/normalize-pipeline.mjs ./pipeline.json ./out.json --strip-outputs
 */

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseAndNormalizeFlowJson } from "../dist/index.js";

const args = process.argv.slice(2);
const stripOutputs = args.includes("--strip-outputs");
const paths = args.filter((a) => !a.startsWith("--"));

const inputPath = paths[0];
const outputPath = paths[1] ?? null;

if (!inputPath) {
  console.error(
    "Usage: node examples/normalize-pipeline.mjs <input.json> [output.json] [--strip-outputs]",
  );
  process.exit(1);
}

const raw = await readFile(resolve(inputPath), "utf8");
const normalized = parseAndNormalizeFlowJson(raw, {
  stripSourceData: true,
  stripOutputs,
  dedupeDataId: true,
});

const text = JSON.stringify(normalized, null, 2);

if (outputPath) {
  await writeFile(resolve(outputPath), text + "\n");
  console.log(`Wrote ${outputPath} (${normalized.nodes.length} nodes, ${normalized.edges.length} edges)`);
} else {
  console.log(text);
}
