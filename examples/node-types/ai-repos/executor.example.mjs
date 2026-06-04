/**
 * Local handler for `aiRepos` — implement your integration here.
 * Registered in examples/node-types/registry.mjs
 *
 * See docs/node-handlers.md
 */

export function createAiReposHandler() {
  return async function aiReposHandler(node) {
    const data = node.data ?? {};
    const config = data.nodeData;

    // TODO: replace stub with real logic (API call, transform, etc.)
    return {
      stub: true,
      type: "aiRepos",
      label: data.label,
      config,
      sourceData: data.sourceData ?? null,
    };
  };
}
