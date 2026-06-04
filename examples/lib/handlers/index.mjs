import { createBuiltinNodeExecutor } from "../../../dist/index.js";
import { buildExtensionHandlers } from "./builtin.mjs";
import { loadCommunityHandlers } from "../../node-types/registry.mjs";

/** @type {Map<string, { type: string, label?: string, receivedFromUpstream: unknown, emitted: unknown }>} */
const dataFlowTrace = new Map();

export function clearDataFlowTrace() {
  dataFlowTrace.clear();
}

/** @param {string} nodeId */
export function getDataFlowTraceEntry(nodeId) {
  return dataFlowTrace.get(nodeId);
}

/**
 * Example executor: package builtins (genText reads GraphEngine `llm`) + webpage + community types.
 *
 * @param {{ traceDataFlow?: boolean }} [options]
 */
export function createNodeExecutor(options = {}) {
  const extensions = buildExtensionHandlers();
  const community = loadCommunityHandlers();
  const coreBuiltin = createBuiltinNodeExecutor();
  const trace = Boolean(options.traceDataFlow);

  return async (node) => {
    const type = node.type ?? "unknown";
    const data = node.data ?? {};

    if (trace) {
      dataFlowTrace.set(node.id, {
        type,
        label: data.label,
        receivedFromUpstream: data.sourceData,
        emitted: undefined,
      });
    }

    const handler = extensions.get(type) ?? community.get(type);

    let result;
    if (handler) {
      result = await handler(node);
    } else {
      result = await coreBuiltin(node);
    }

    if (trace) {
      const entry = dataFlowTrace.get(node.id);
      if (entry) entry.emitted = result;
    }

    return result;
  };
}
