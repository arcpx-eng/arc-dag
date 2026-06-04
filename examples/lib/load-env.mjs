import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Load KEY=VALUE pairs from a .env file into process.env.
 * Does not override non-empty existing process.env values.
 *
 * @param {string} filePath
 * @param {string} [cwd]
 * @returns {boolean}
 */
export function loadEnvFile(filePath = ".env", cwd = process.cwd()) {
  const fullPath = resolve(cwd, filePath);
  if (!existsSync(fullPath)) return false;

  const text = readFileSync(fullPath, "utf8");
  for (const line of text.split("\n")) {
    let trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    if (trimmed.startsWith("export ")) {
      trimmed = trimmed.slice(7).trim();
    }

    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env) || process.env[key] === "") {
      process.env[key] = value;
    }
  }
  return true;
}

/**
 * @param {string} cwd
 * @param {string} relativePath
 */
export function envFilePath(cwd, relativePath) {
  return resolve(cwd, relativePath);
}
