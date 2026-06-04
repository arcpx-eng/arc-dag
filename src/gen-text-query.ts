import type { FlowNode } from "./flow-document.js";

export function formatUpstreamForPrompt(item: unknown): string {
  if (typeof item === "string") return item;
  if (item && typeof item === "object") {
    const o = item as Record<string, unknown>;
    const title = o.title ?? o.label ?? o.url ?? "Source";
    const lines = [`### ${title}`];
    if (o.url) lines.push(`URL: ${o.url}`);
    if (o.status != null) lines.push(`HTTP: ${o.status}`);
    const body =
      typeof o.text === "string" ? o.text : JSON.stringify(o, null, 2);
    lines.push("", body);
    return lines.join("\n");
  }
  return String(item);
}

export function normalizeOutputTargetKey(name: unknown): string {
  const s = String(name).trim();
  return s.startsWith("$") ? s.slice(1) : s;
}

export function collectNamedSourceVars(parts: unknown[]): Record<string, string> {
  const vars: Record<string, string> = {};

  for (const p of parts) {
    if (!p || typeof p !== "object") continue;
    const o = p as Record<string, unknown>;

    if (o.outputTarget) {
      vars[normalizeOutputTargetKey(o.outputTarget)] =
        formatUpstreamForPrompt(p);
    }

    if (o.cells && typeof o.cells === "object") {
      for (const [key, val] of Object.entries(
        o.cells as Record<string, unknown>,
      )) {
        vars[normalizeOutputTargetKey(key)] = formatUpstreamForPrompt(val);
      }
    }
  }

  return vars;
}

/** Build genText prompt from ArcPX-style nodeData + fan-in sourceData. */
export function resolveGenTextQuery(node: FlowNode): string {
  const data = node.data ?? {};
  let template =
    typeof data.nodeData === "string"
      ? data.nodeData
      : data.nodeData && typeof data.nodeData === "object"
        ? String(
            (data.nodeData as Record<string, unknown>).query ??
              (data.nodeData as Record<string, unknown>).prompt ??
              "",
          )
        : "";

  const raw = data.sourceData;
  const parts = Array.isArray(raw) ? raw : raw != null ? [raw] : [];

  const vars: Record<string, string> = {
    upstream: parts.map(formatUpstreamForPrompt).join("\n\n---\n\n"),
    ...collectNamedSourceVars(parts),
  };
  parts.forEach((p, i) => {
    vars[`source_${i + 1}`] = formatUpstreamForPrompt(p);
  });

  if (/\{\$[a-zA-Z0-9_-]+\}/.test(template)) {
    template = template.replace(/\{\$([a-zA-Z0-9_-]+)\}/g, (_, name) => {
      if (vars[name] !== undefined) return vars[name];
      return vars.upstream;
    });
  } else if (parts.length > 0) {
    template = `${template.trim()}\n\n## Upstream context\n\n${vars.upstream}`;
  }

  return template.trim();
}
