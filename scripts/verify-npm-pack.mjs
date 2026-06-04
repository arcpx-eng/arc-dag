#!/usr/bin/env node
/**
 * Pre-publish guard: confirm npm pack only includes the intended files
 * and does not ship env files or credential-like strings.
 *
 * Uses `npm pack --dry-run --json` (no tarball) so this works inside
 * `npm publish --dry-run` / prepublishOnly without nested pack failures.
 */
import { execSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const ALLOWED_TOP_LEVEL = new Set([
  "package.json",
  "dist",
  "README.md",
  "LICENSE",
  "arcpx-logo.svg",
]);

const SECRET_PATTERNS = [
  /AKIA[0-9A-Z]{16}/,
  /\bsk-[a-zA-Z0-9]{20,}\b/,
  /bedrock-api-key-[A-Za-z0-9%+/=]{40,}/,
  /BEGIN (RSA |OPENSSH )?PRIVATE KEY/,
];

function scanText(label, text) {
  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(text)) {
      console.error(`Possible secret in published file: ${label}`);
      process.exit(1);
    }
  }
}

function walkJsFiles(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name);
    if (statSync(abs).isDirectory()) {
      walkJsFiles(abs, out);
    } else if (name.endsWith(".js")) {
      out.push(abs);
    }
  }
  return out;
}

const raw = execSync("npm pack --dry-run --json", {
  cwd: root,
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
});

const packs = JSON.parse(raw.trim());
const pack = Array.isArray(packs) ? packs[0] : packs;
const entries = pack.files.map((f) => f.path);
const topLevels = new Set(entries.map((p) => p.split("/")[0]));

const unexpected = [...topLevels].filter((e) => !ALLOWED_TOP_LEVEL.has(e));
if (unexpected.length > 0) {
  console.error("npm pack includes unexpected top-level paths:", unexpected.join(", "));
  process.exit(1);
}

const forbiddenNames = entries.filter((e) =>
  /\.env(\.|$)|credentials|secret|\.pem$|id_rsa/i.test(e),
);
if (forbiddenNames.length > 0) {
  console.error("npm pack includes forbidden file names:\n", forbiddenNames.join("\n"));
  process.exit(1);
}

for (const rel of ["README.md", "LICENSE"]) {
  scanText(rel, readFileSync(join(root, rel), "utf8"));
}

for (const abs of walkJsFiles(join(root, "dist"))) {
  const rel = abs.slice(root.length + 1);
  if (entries.some((e) => e === rel)) {
    scanText(rel, readFileSync(abs, "utf8"));
  }
}

console.log(`npm pack OK — ${entries.length} files: ${[...topLevels].join(", ")}`);
