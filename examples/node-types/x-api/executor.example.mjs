/**
 * Example xApi handler — copy into your nodeExecutor or extend via PR.
 *
 * Uses fetch + Bearer token (no SDK required in this stub).
 */

const API_BASE = "https://api.x.com/2";

export function createXApiHandler() {
  return async function xApiNode(node) {
    const token = process.env.X_API_BEARER_TOKEN;
    if (!token) {
      throw new Error("X_API_BEARER_TOKEN env var is required for xApi nodes");
    }

    const config = node.data?.nodeData;
    if (!config || typeof config !== "object") {
      throw new Error("xApi node requires data.nodeData object");
    }

    const { operation } = config;

    switch (operation) {
      case "searchRecent": {
        const query = encodeURIComponent(String(config.query ?? ""));
        const maxResults = Number(config.maxResults ?? 10);
        const url = `${API_BASE}/tweets/search/recent?query=${query}&max_results=${maxResults}`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const body = await res.text();
          throw new Error(`X API ${res.status}: ${body}`);
        }
        return res.json();
      }
      default:
        throw new Error(`xApi: unknown operation "${operation}" — add it via PR`);
    }
  };
}
