import { formatChatTurn } from "./payload-formatter.js";
import type { FlowDocument, FlowEdge, FlowNode } from "./flow-document.js";
import { mergeLlmConfigIntoGlobalSettings } from "./llm-config.js";
import type {
  GraphEngineOptions,
  NodeEvent,
  NodeExecutor,
} from "./types.js";

type NodeMeta = {
  status: "pending" | "completed" | "error";
  dependencies: string[];
  output: unknown;
  processingPromise?: Promise<void>;
};

const DEFAULT_AGGREGATE_TYPES = ["genText", "pipeNode"];

function nodeKind(node: FlowNode): string {
  if (node.type) return node.type;
  return node.id.split("_")[0] ?? node.id;
}

function buildExecutionNode(
  node: FlowNode,
  sourceData: unknown,
  settings: Record<string, unknown>,
): FlowNode {
  return {
    ...node,
    data: {
      ...(node.data ?? {}),
      settings,
      sourceData,
    },
  };
}

export class GraphEngine {
  private flow: FlowDocument;
  private nodes: FlowNode[];
  private edges: FlowEdge[];
  private globalSettings: Record<string, unknown>;
  private nodeExecutor: NodeExecutor;
  private aggregateSourceTypes: Set<string>;
  private graph: Record<string, FlowNode[]> = {};
  private nodeMeta: Record<string, NodeMeta> = {};
  private subscribers: Array<(event: NodeEvent) => void> = [];

  constructor(options: GraphEngineOptions) {
    this.flow = options.flow;
    this.nodes = options.flow.nodes ?? [];
    this.edges = options.flow.edges ?? [];
    this.globalSettings = mergeLlmConfigIntoGlobalSettings(
      options.llm,
      options.globalSettings ?? {},
    );
    this.nodeExecutor = options.nodeExecutor;
    this.aggregateSourceTypes = new Set(
      options.aggregateSourceTypes ?? DEFAULT_AGGREGATE_TYPES,
    );

    for (const node of this.nodes) {
      const seeded =
        options.initialOutputs?.[node.id] ??
        node.data?.nodeOutput ??
        null;
      this.nodeMeta[node.id] = {
        status: "pending",
        dependencies: [],
        output: seeded,
      };
    }

    this._buildGraph();
  }

  /** The pipeline document this engine was constructed from. */
  getFlow(): FlowDocument {
    return this.flow;
  }

  /** Merged global + `llm` settings passed to each node at run time. */
  getGlobalSettings(): Record<string, unknown> {
    return { ...this.globalSettings };
  }

  private _buildGraph() {
    for (const edge of this.edges) {
      if (!this.nodeMeta[edge.target]) continue;
      this.nodeMeta[edge.target].dependencies.push(edge.source);
      const source = this.nodes.find((n) => n.id === edge.source);
      const target = this.nodes.find((n) => n.id === edge.target);
      if (source && target) {
        (this.graph[source.id] ??= []).push(target);
      }
    }
  }

  subscribe(handler: (event: NodeEvent) => void): () => void {
    this.subscribers.push(handler);
    return () => {
      this.subscribers = this.subscribers.filter((h) => h !== handler);
    };
  }

  private _emit(event: NodeEvent) {
    for (const handler of this.subscribers) {
      handler(event);
    }
  }

  private _shouldAggregateSource(node: FlowNode): boolean {
    const kind = nodeKind(node);
    if (this.aggregateSourceTypes.has(kind) || (node.type && this.aggregateSourceTypes.has(node.type))) {
      return true;
    }
    const isLeaf = !this.graph[node.id] || this.graph[node.id].length === 0;
    return isLeaf;
  }

  private _getDependencyData(id: string, visited: Set<string> = new Set()): unknown[] {
    if (visited.has(id)) return [];
    visited.add(id);

    const deps = this.nodeMeta[id].dependencies;
    const node = this.nodes.find((n) => n.id === id)!;
    const mergedSettings = {
      ...this.globalSettings,
      ...((node.data?.settings as Record<string, unknown> | undefined) ?? {}),
    };

    const allData: unknown[] = [];
    for (const depId of deps) {
      const depNode = this.nodes.find((n) => n.id === depId)!;
      const depKind = nodeKind(depNode);

      if (depKind === "genText") {
        const depInput = depNode.data?.nodeData ?? null;
        const serviceMode = (mergedSettings.serviceMode as string) ?? "built-in";
        const chatHistory = formatChatTurn(
          serviceMode,
          String(depInput ?? ""),
          String(this.nodeMeta[depId].output ?? ""),
        );
        allData.unshift({ type: depKind, data: chatHistory });
      } else {
        allData.unshift(this.nodeMeta[depId].output);
      }

      if (depNode.data?.isPassThrough) {
        allData.unshift(...this._getDependencyData(depId, visited));
      }
    }
    return allData;
  }

  private _processNode = async (node: FlowNode): Promise<void> => {
    const nodeId = node.id;
    const meta = this.nodeMeta[nodeId];
    if (!meta) return;

    if (meta.processingPromise) return meta.processingPromise;
    if (meta.status === "completed") return;

    const promise = (async () => {
      const depPromises = meta.dependencies.map((depId) => {
        const depNode = this.nodes.find((n) => n.id === depId);
        if (depNode && this.nodeMeta[depId].status !== "completed") {
          return this._processNode(depNode);
        }
        return Promise.resolve();
      });
      await Promise.all(depPromises);

      this._emit({ type: "node:start", nodeId });

      try {
        const sourceData = this._shouldAggregateSource(node)
          ? this._getDependencyData(nodeId)
          : this.nodeMeta[meta.dependencies[0]]?.output;

        const mergedSettings = {
          ...this.globalSettings,
          ...((node.data?.settings as Record<string, unknown> | undefined) ?? {}),
        };

        const executionNode = buildExecutionNode(node, sourceData, mergedSettings);
        const result = await this.nodeExecutor(executionNode);

        meta.status = "completed";
        meta.output = result;
        this._emit({ type: "node:complete", nodeId, output: result });
      } catch (error) {
        meta.status = "error";
        this._emit({ type: "node:error", nodeId, error });
        throw error;
      }
    })();

    meta.processingPromise = promise;
    return promise;
  };

  getGraph(): Record<string, FlowNode[]> {
    return this.graph;
  }

  async run(): Promise<Map<string, unknown>> {
    if (!this.nodes.length) {
      throw new Error("Pipeline has no nodes");
    }

    await Promise.all(this.nodes.map((n) => this._processNode(n)));

    return new Map(
      Object.entries(this.nodeMeta).map(([id, meta]) => [id, meta.output]),
    );
  }
}
