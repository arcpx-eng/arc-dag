import type { FlowNode } from "./flow-document.js";
import { runGenTextNode } from "./gen-text-handler.js";
import type { NodeExecutor } from "./types.js";

async function pipeNodeHandler(node: FlowNode): Promise<unknown> {
  const data = node.data ?? {};
  const upstream = data.sourceData;

  const result: Record<string, unknown> = {
    type: "pipeNode",
    label: data.label,
    outputTarget: data.outputTarget ?? null,
    isPassThrough: Boolean(data.isPassThrough),
    value: upstream,
  };

  if (data.outputTarget) {
    result.cells = { [String(data.outputTarget)]: upstream };
  }

  return result;
}

const CORE_HANDLERS: Record<string, (node: FlowNode) => Promise<unknown>> = {
  text: async (node) => node.data?.nodeData ?? null,
  startNode: async (node) => node.data?.nodeData ?? null,
  standardOutput: async (node) => node.data?.sourceData,
  endNode: async (node) => node.data?.sourceData,
  groupNode: async (node) => {
    const data = node.data ?? {};
    return {
      type: "groupNode",
      group: true,
      label: data.label,
      sourceData: data.sourceData ?? null,
    };
  },
  pipeNode: pipeNodeHandler,
  genText: runGenTextNode,
  LLM: runGenTextNode,
};

/**
 * Built-in executor for ArcPX core node types (`genText`, `pipeNode`, `text`, …).
 * Reads LLM credentials from `node.data.settings` (merged from `GraphEngine({ llm })`).
 */
export function createBuiltinNodeExecutor(): NodeExecutor {
  return async (node) => {
    const type = node.type ?? "unknown";
    const handler = CORE_HANDLERS[type];
    if (handler) return handler(node);

    return {
      stub: true,
      type,
      note: `Unknown node.type "${type}". Register a custom handler via nodeExecutor or extend createBuiltinNodeExecutor.`,
      sourceData: node.data?.sourceData,
      nodeData: node.data?.nodeData,
    };
  };
}
