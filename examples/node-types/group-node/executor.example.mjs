/**
 * Local handler for `groupNode` (canvas container — pass-through).
 * Registered in examples/node-types/registry.mjs
 */

export function createGroupNodeHandler() {
  return async function groupNodeHandler(node) {
    const data = node.data ?? {};
    return {
      type: "groupNode",
      label: data.label,
      sourceData: data.sourceData ?? null,
    };
  };
}
