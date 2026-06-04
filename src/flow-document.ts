/**
 * Pipeline graph JSON — nodes, edges, and optional viewport.
 * Same structure used by ArcPX `node_data` and generic DAG editor exports.
 */

export type FlowViewport = {
  x: number;
  y: number;
  zoom: number;
};

/** A node in the pipeline graph. */
export type FlowNode<
  TData extends Record<string, unknown> = FlowNodeData,
> = {
  id: string;
  type?: string;
  position?: { x: number; y: number };
  data?: TData;
  width?: number;
  height?: number;
  selected?: boolean;
  dragging?: boolean;
  measured?: { width?: number; height?: number };
  parentId?: string;
  zIndex?: number;
  extent?: "parent" | [[number, number], [number, number]];
  expandParent?: boolean;
  [key: string]: unknown;
};

/** A directed edge between two nodes. */
export type FlowEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  type?: string;
  animated?: boolean;
  style?: Record<string, unknown>;
  data?: Record<string, unknown>;
  [key: string]: unknown;
};

/** Full pipeline document passed to GraphEngine. */
export type FlowDocument<
  TData extends Record<string, unknown> = FlowNodeData,
> = {
  nodes: FlowNode<TData>[];
  edges: FlowEdge[];
  viewport?: FlowViewport;
};

/** Common `node.data` fields used by ArcPX-style graphs. */
export type FlowNodeData = Record<string, unknown> & {
  label?: string;
  id?: string;
  nodeData?: unknown;
  nodeOutput?: unknown;
  /** pipeNode: variable name for downstream `{$name}` substitution */
  outputTarget?: string;
  isPassThrough?: boolean;
  settings?: Record<string, unknown>;
  /** Populated by GraphEngine before each nodeExecutor call. */
  sourceData?: unknown;
};
