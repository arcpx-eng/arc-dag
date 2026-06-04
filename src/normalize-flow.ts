import type { FlowDocument, FlowEdge, FlowNode } from "./flow-document.js";

const NODE_UI_KEYS = [
  "measured",
  "className",
  "selected",
  "dragging",
  "width",
  "height",
  "positionAbsolute",
] as const;

const EDGE_UI_KEYS = ["animated", "style", "selected"] as const;

export type NormalizeFlowOptions = {
  /**
   * Remove `data.sourceData` (canvas/runtime field). Default: true.
   */
  stripSourceData?: boolean;
  /**
   * Remove `data.nodeOutput` (cached run results). Default: false — keep so
   * GraphEngine can seed `initialOutputs`; set true for a clean re-run.
   */
  stripOutputs?: boolean;
  /** Remove `position` from nodes. Default: false. */
  stripPositions?: boolean;
  /** Remove duplicate `data.id` when it matches node `id`. Default: true. */
  dedupeDataId?: boolean;
};

const defaultOptions: Required<NormalizeFlowOptions> = {
  stripSourceData: true,
  stripOutputs: false,
  stripPositions: false,
  dedupeDataId: true,
};

function normalizeNodeData(
  data: Record<string, unknown> | undefined,
  nodeId: string,
  opts: Required<NormalizeFlowOptions>,
): Record<string, unknown> | undefined {
  if (!data) return undefined;

  const next = { ...data };

  if (opts.stripSourceData && "sourceData" in next) {
    delete next.sourceData;
  }

  if (opts.stripOutputs && "nodeOutput" in next) {
    delete next.nodeOutput;
  }

  if (opts.dedupeDataId && next.id === nodeId) {
    delete next.id;
  }

  return Object.keys(next).length > 0 ? next : undefined;
}

function normalizeNode(
  node: FlowNode,
  opts: Required<NormalizeFlowOptions>,
): FlowNode {
  const { data, position, ...rest } = node;
  const clean: FlowNode = { id: node.id };

  if (node.type) clean.type = node.type;
  if (!opts.stripPositions && position) clean.position = position;

  const normalizedData = normalizeNodeData(
    data as Record<string, unknown> | undefined,
    node.id,
    opts,
  );
  if (normalizedData) clean.data = normalizedData;

  return clean;
}

function normalizeEdge(edge: FlowEdge): FlowEdge {
  const clean: FlowEdge = {
    id: edge.id,
    source: edge.source,
    target: edge.target,
  };
  if (edge.type) clean.type = edge.type;
  if (edge.sourceHandle != null) clean.sourceHandle = edge.sourceHandle;
  if (edge.targetHandle != null) clean.targetHandle = edge.targetHandle;
  if (edge.data) clean.data = edge.data;
  return clean;
}

/**
 * Strip canvas-only fields from an exported pipeline so the payload is stable
 * for async-dag runs, version control, and documentation.
 */
export function normalizeFlow(
  flow: FlowDocument,
  options?: NormalizeFlowOptions,
): FlowDocument {
  const opts = { ...defaultOptions, ...options };

  return {
    nodes: flow.nodes.map((n) => normalizeNode(n, opts)),
    edges: flow.edges.map(normalizeEdge),
    ...(flow.viewport ? { viewport: flow.viewport } : {}),
  };
}

/** Fields removed from exports by {@link normalizeFlow}. */
export const CANVAS_ONLY_NODE_FIELDS = [...NODE_UI_KEYS] as const;
export const CANVAS_ONLY_EDGE_FIELDS = [...EDGE_UI_KEYS] as const;
