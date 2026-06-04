import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

/** @type {readline.Interface | null} */
let session = null;

function getSession() {
  if (!session) {
    session = readline.createInterface({ input, output });
  }
  return session;
}

export async function closePromptSession() {
  if (session) {
    session.close();
    session = null;
  }
}

/**
 * @param {string} question
 * @param {string} [defaultValue]
 */
export async function ask(question, defaultValue = "") {
  const rl = getSession();
  const hint =
    defaultValue !== undefined && defaultValue !== ""
      ? ` [${defaultValue}]`
      : "";
  const raw = await rl.question(`${question}${hint}: `);
  const trimmed = raw.trim();
  return trimmed === "" ? defaultValue : trimmed;
}

/**
 * @param {string} question
 * @param {string[]} choices
 * @param {number} [defaultIndex] 0-based
 */
export async function choose(question, choices, defaultIndex = 0) {
  console.log(`\n${question}`);
  choices.forEach((c, i) => {
    const mark = i === defaultIndex ? "*" : " ";
    console.log(`  ${mark} ${i + 1}) ${c}`);
  });
  const raw = await ask("Choice", String(defaultIndex + 1));
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n) || n < 1 || n > choices.length) {
    return choices[defaultIndex];
  }
  return choices[n - 1];
}

/** @param {string} question */
export async function confirm(question) {
  const raw = await ask(`${question} (y/N)`, "n");
  return raw.toLowerCase() === "y" || raw.toLowerCase() === "yes";
}

/**
 * @param {{ yes?: boolean }} [opts]
 */
export function canRunWizard(opts = {}) {
  if (opts.yes) return true;
  return Boolean(input.isTTY || output.isTTY);
}
