/**
 * ArcPX core: pipeNode — pass upstream data through, optional named outputTarget.
 */

/**
 * @param {import("../../../dist/flow-document.js").FlowNode} node
 */
export async function pipeNodeHandler(node) {
  const data = node.data ?? {};
  const upstream = data.sourceData;

  /** @type {Record<string, unknown>} */
  const result = {
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
