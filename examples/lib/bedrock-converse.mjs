/**
 * Re-exports from the async-dag package (single source of truth in src/).
 * Examples and tests import this path; run `npm run build` first.
 */
export {
  bedrockConverse,
  collectHistoryFromSourceData,
  formatHistoryForBedrock,
} from "../../dist/bedrock-converse.js";

export {
  collectNamedSourceVars,
  formatUpstreamForPrompt,
  normalizeOutputTargetKey,
  resolveGenTextQuery,
} from "../../dist/gen-text-query.js";
