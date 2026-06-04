import type { FlowDocument, FlowNode } from "./flow-document.js";
import type { LlmConfig } from "./llm-config.js";

export type {
  FlowDocument,
  FlowEdge,
  FlowNode,
  FlowNodeData,
  FlowViewport,
} from "./flow-document.js";

export type NodeEvent =
  | { type: "node:start"; nodeId: string }
  | { type: "node:complete"; nodeId: string; output: unknown }
  | { type: "node:error"; nodeId: string; error: unknown };

/**
 * Called once per node at execution time.
 * `node` is a pipeline graph node from the JSON document, with `data.sourceData`
 * and merged `data.settings` set for that run.
 */
export type NodeExecutor = (node: FlowNode) => Promise<unknown>;

export type GraphEngineOptions = {
  /** Pipeline JSON (`nodes`, `edges`, optional `viewport`). */
  flow: FlowDocument;
  nodeExecutor: NodeExecutor;
  /**
   * LLM provider + credentials — merged into each node's `data.settings`.
   * Prefer this over putting API keys in `globalSettings` directly.
   */
  llm?: LlmConfig;
  globalSettings?: Record<string, unknown>;
  /** Pre-seed outputs keyed by node id (e.g. from `data.nodeOutput`). */
  initialOutputs?: Record<string, unknown>;
  /**
   * Node types that receive aggregated dependency data instead of a single parent output.
   * Defaults to `["genText", "pipeNode"]`.
   */
  aggregateSourceTypes?: string[];
};
