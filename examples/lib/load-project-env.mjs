import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnvFile, envFilePath } from "./load-env.mjs";

/** @param {string} root */
function tryLoad(root, relativePath) {
  const path = envFilePath(root, relativePath);
  if (!existsSync(path)) return null;
  loadEnvFile(relativePath, root);
  return path;
}

/**
 * Load env from repo root (not process.cwd() — safe when npm changes cwd).
 *
 * Tries, in order:
 *   1. .env
 *   2. .env.bedrock  (Bedrock keys; can be separate or duplicate)
 *
 * You may put BEDROCK_* in either file. Both are loaded if present.
 *
 * @param {string} [root] — absolute path to async-dag repo root
 * @returns {{ loaded: string[], checked: { path: string, exists: boolean }[] }}
 */
export function loadProjectEnv(root = process.cwd()) {
  const candidates = [".env", ".env.bedrock"];
  /** @type {string[]} */
  const loaded = [];
  /** @type {{ path: string, exists: boolean }[]} */
  const checked = [];

  for (const file of candidates) {
    const absolute = envFilePath(root, file);
    const exists = existsSync(absolute);
    checked.push({ path: absolute, exists });
    if (exists) {
      loadEnvFile(file, root);
      loaded.push(file);
    }
  }

  return { loaded, checked, root: resolve(root) };
}

/**
 * @param {{ loaded: string[], checked: { path: string, exists: boolean }[], root: string }} result
 */
export function formatEnvLoadReport(result) {
  const lines = [`Env search root: ${result.root}`];
  for (const { path, exists } of result.checked) {
    lines.push(`  ${exists ? "✓" : "✗"} ${path}`);
  }
  if (result.loaded.length) {
    lines.push(`Loaded: ${result.loaded.join(", ")}`);
  } else {
    lines.push(
      "Loaded: (none) — copy .env.bedrock.template → .env.bedrock at repo root",
    );
  }
  lines.push(
    `BEDROCK_API_KEY: ${process.env.BEDROCK_API_KEY ? "set" : "missing"}`,
  );
  return lines.join("\n");
}
