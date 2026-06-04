/**
 * ArcPX core: genText — delegates to package `runGenTextNode` (reads GraphEngine llm config).
 */
import { runGenTextNode } from "../../../dist/gen-text-handler.js";

/** @param {Record<string, unknown>} [_globalSettings] — unused; settings come from GraphEngine per node */
export function createGenTextHandler(_globalSettings = {}) {
  return runGenTextNode;
}
