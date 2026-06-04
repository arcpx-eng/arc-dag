import { readFile } from "node:fs/promises";
import { normalizeFlow, type NormalizeFlowOptions } from "./normalize-flow.js";
import type { FlowDocument } from "./flow-document.js";

function assertFlowShape(value: unknown): FlowDocument {
  if (!value || typeof value !== "object") {
    throw new Error("Flow JSON must be an object with nodes and edges arrays");
  }

  const record = value as Record<string, unknown>;
  const nodes = record.nodes;
  const edges = record.edges;

  if (!Array.isArray(nodes) || !Array.isArray(edges)) {
    throw new Error("Flow JSON must include nodes[] and edges[]");
  }

  return {
    nodes,
    edges,
    viewport: record.viewport as FlowDocument["viewport"],
  };
}

/**
 * Parse pipeline JSON from a DAG editor export, ArcPX download, or save API.
 *
 * Accepts:
 * - `{ nodes, edges, viewport? }` — canvas download / editor export
 * - `{ node_data: { nodes, edges } }` — pipeline API payload
 * - `{ flow: { nodes, edges }, globalSettings? }` — local run bundle
 */
export function parseFlowJson(raw: string | unknown): FlowDocument {
  const parsed =
    typeof raw === "string" ? (JSON.parse(raw) as unknown) : raw;

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid flow JSON");
  }

  const record = parsed as Record<string, unknown>;

  if (record.flow && typeof record.flow === "object") {
    return assertFlowShape(record.flow);
  }

  if (record.node_data && typeof record.node_data === "object") {
    return assertFlowShape(record.node_data);
  }

  return assertFlowShape(parsed);
}

/**
 * Parse pipeline JSON and strip canvas-only fields in one step.
 */
export function parseAndNormalizeFlowJson(
  raw: string | unknown,
  normalizeOptions?: NormalizeFlowOptions,
): FlowDocument {
  return normalizeFlow(parseFlowJson(raw), normalizeOptions);
}

export function parseGlobalSettings(raw: string | unknown): Record<string, unknown> {
  const parsed =
    typeof raw === "string" ? (JSON.parse(raw) as unknown) : raw;

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid global settings JSON");
  }

  const record = parsed as Record<string, unknown>;

  if (record.globalSettings && typeof record.globalSettings === "object") {
    return record.globalSettings as Record<string, unknown>;
  }

  if (record.global_settings && typeof record.global_settings === "object") {
    return record.global_settings as Record<string, unknown>;
  }

  return record as Record<string, unknown>;
}

export async function loadFlowFromFile(
  filePath: string,
  normalizeOptions?: NormalizeFlowOptions,
): Promise<FlowDocument> {
  const text = await readFile(filePath, "utf8");
  const flow = parseFlowJson(text);
  return normalizeOptions ? normalizeFlow(flow, normalizeOptions) : flow;
}

export async function loadGlobalSettingsFromFile(
  filePath: string,
): Promise<Record<string, unknown>> {
  const text = await readFile(filePath, "utf8");
  return parseGlobalSettings(text);
}
