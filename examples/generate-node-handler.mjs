#!/usr/bin/env node
/**
 * Interactive scaffold for a local node.type handler.
 *
 * Usage:
 *   npm run generate:handler
 *   npm run generate:handler -- aiRepos
 *   npm run generate:handler -- --force
 */

import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ask,
  choose,
  confirm,
  canRunWizard,
  closePromptSession,
} from "./lib/interactive-prompt.mjs";
import {
  toSlug,
  toPascal,
  buildExecutorSource,
  buildReadme,
  buildSampleNode,
  printSummary,
} from "./lib/node-handler-templates.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const NODE_TYPES = join(ROOT, "examples/node-types");
const REGISTRY = join(NODE_TYPES, "registry.mjs");

const CONTAINER_TYPES = new Set(["groupNode", "group", "customGroup"]);

function parseFlags(argv) {
  const flags = { force: false, yes: false };
  const positional = [];
  for (const a of argv.slice(2)) {
    if (a === "--force") flags.force = true;
    else if (a === "--yes" || a === "-y") flags.yes = true;
    else if (a === "--help" || a === "-h") positional.push("help");
    else positional.push(a);
  }
  return { flags, nodeTypeHint: positional[0] === "help" ? undefined : positional[0] };
}

function printHelp() {
  console.log(`arc-dag — generate a local node handler (interactive)

Usage:
  npm run generate:handler
  npm run generate:handler -- <nodeType>
  npm run generate:handler -- <nodeType> --force

Flags:
  --force   Overwrite files if the folder already exists
  --yes     Skip final confirmation (non-TTY only with this flag)

The wizard asks for node.type, kind, description, nodeData sample, and env vars,
then writes:
  examples/node-types/<slug>/executor.example.mjs
  examples/node-types/<slug>/README.md
  examples/node-types/<slug>/node.sample.json
and registers the handler in examples/node-types/registry.mjs

Docs: docs/node-handlers.md
`);
}

/**
 * @param {string} raw
 */
function parseNodeDataJson(raw) {
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "{}") return {};
  try {
    const parsed = JSON.parse(trimmed);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      throw new Error("nodeData must be a JSON object");
    }
    return parsed;
  } catch (err) {
    throw new Error(`Invalid JSON: ${err.message}`);
  }
}

/**
 * @param {{ nodeTypeHint?: string, flags: { force: boolean, yes: boolean } }} opts
 */
async function collectConfig(opts) {
  console.log("\narc-dag — new node handler\n");

  const nodeType = await ask(
    "node.type (exact string from pipeline JSON, e.g. aiRepos, groupNode)",
    opts.nodeTypeHint ?? "",
  );
  if (!nodeType || !/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(nodeType)) {
    throw new Error("node.type must be a non-empty identifier (letters, numbers, _, -)");
  }

  const defaultKind = CONTAINER_TYPES.has(nodeType) ? "container" : "integration";
  const kind = await choose(
    "Handler kind",
    ["container — canvas/layout (pass-through)", "integration — API/data (you implement)"],
    defaultKind === "container" ? 0 : 1,
  );
  const kindKey = kind.startsWith("container") ? "container" : "integration";

  const sampleLabel = await ask(
    "Sample node label (for node.sample.json)",
    nodeType,
  );

  const description = await ask(
    "Short description (one line, used in README and comments)",
    kindKey === "container"
      ? `Canvas container node (${nodeType}).`
      : `Integration handler for ${nodeType}.`,
  );

  /** @type {Record<string, unknown>} */
  let sampleNodeData = {};
  /** @type {{ name: string, description: string }[]} */
  const envVars = [];
  let implementationNotes = "";

  if (kindKey === "integration") {
    console.log(
      "\nPaste sample data.nodeData as JSON (from your ArcPX export), or press Enter for {}.",
    );
    let valid = false;
    while (!valid) {
      try {
        const raw = await ask("Sample nodeData JSON", "{}");
        sampleNodeData = parseNodeDataJson(raw);
        valid = true;
      } catch (err) {
        console.error(`  ${err.message} — try again.`);
      }
    }

    console.log("\nEnvironment variables (press Enter on name to finish).");
    while (true) {
      const name = await ask("  Env var name", "");
      if (!name) break;
      const desc = await ask(`  Description for ${name}`, "");
      envVars.push({ name, description: desc });
    }

    implementationNotes = await ask(
      "Implementation hint (optional, added as comment in executor)",
      "",
    );
  }

  const slug = toSlug(nodeType);
  const pascal = toPascal(slug);

  return {
    nodeType,
    slug,
    pascal,
    kind: kindKey,
    description,
    sampleLabel,
    sampleNodeData,
    envVars,
    implementationNotes,
    force: opts.flags.force,
  };
}

/**
 * @param {{ nodeType: string, slug: string, pascal: string }} cfg
 */
function patchRegistry(cfg) {
  const importLine = `import { create${cfg.pascal}Handler } from "./${cfg.slug}/executor.example.mjs";`;
  const setLine = `  handlers.set("${cfg.nodeType}", create${cfg.pascal}Handler());`;

  let src = readFileSync(REGISTRY, "utf8");

  if (!src.includes(importLine)) {
    src = src.replace(/^(import .+\n)+/m, (block) => `${block}${importLine}\n`);
  }

  const start = "  // --- GENERATED:HANDLERS:START ---";
  if (!src.includes(start)) {
    throw new Error("registry.mjs missing GENERATED:HANDLERS markers");
  }

  if (!src.includes(setLine)) {
    src = src.replace(`${start}\n`, `${start}\n${setLine}\n`);
  }

  writeFileSync(REGISTRY, src);
  console.log(`Updated examples/node-types/registry.mjs`);
}

/**
 * @param {import("./lib/node-handler-templates.mjs").NodeHandlerConfig} cfg
 */
function writeFiles(cfg) {
  const dir = join(NODE_TYPES, cfg.slug);

  if (existsSync(dir) && !cfg.force) {
    throw new Error(
      `Folder exists: examples/node-types/${cfg.slug}/ — re-run with --force to overwrite`,
    );
  }

  mkdirSync(dir, { recursive: true });

  const files = {
    "executor.example.mjs": buildExecutorSource(cfg),
    "README.md": buildReadme(cfg),
    "node.sample.json": buildSampleNode(cfg),
  };

  for (const [name, content] of Object.entries(files)) {
    writeFileSync(join(dir, name), content);
    console.log(`Wrote examples/node-types/${cfg.slug}/${name}`);
  }

  patchRegistry(cfg);
}

async function main() {
  const { flags, nodeTypeHint } = parseFlags(process.argv);

  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    printHelp();
    process.exit(0);
  }

  if (!canRunWizard(flags)) {
    console.error(
      "Run in a terminal: npm run generate:handler\n(Add --yes to skip confirmation when stdout is not a TTY.)",
    );
    printHelp();
    process.exit(1);
  }

  try {
    const cfg = await collectConfig({ nodeTypeHint, flags });
    printSummary(cfg);

    if (!flags.yes) {
      const ok = await confirm("Create these files?");
      if (!ok) {
        console.log("Cancelled.");
        process.exit(0);
      }
    }

    writeFiles({ ...cfg, force: flags.force });

    console.log(`
Done. Next:
  1. Edit examples/node-types/${cfg.slug}/executor.example.mjs
  2. npm run build && node examples/run-local.mjs <pipeline.json>
`);
  } finally {
    await closePromptSession();
  }
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
