/**
 * Fan-in leaf: format aggregated upstream data and render to a .md file.
 * node.type: markdownOutput (aliases: markdown, markdownReport)
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  normalizeSource,
  renderMarkdownReport,
  slugify,
} from "./format-report.mjs";

const EXAMPLES_ROOT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../..",
);

/**
 * @param {Record<string, unknown>} config
 * @param {string} title
 */
function resolveOutputPath(config, title) {
  const raw =
    config.outputPath ??
    config.outputFile ??
    `./examples/output/${slugify(title)}.md`;
  const path = resolve(String(raw));
  return path.startsWith(EXAMPLES_ROOT) || path.startsWith(process.cwd())
    ? path
    : resolve(EXAMPLES_ROOT, "output", `${slugify(title)}.md`);
}

export function createMarkdownOutputHandler() {
  return async function markdownOutput(node) {
    const data = node.data ?? {};
    const config =
      data.nodeData && typeof data.nodeData === "object"
        ? data.nodeData
        : {};

    const raw = data.sourceData;
    const upstream = Array.isArray(raw) ? raw : raw != null ? [raw] : [];
    const sources = upstream.map((item, i) => normalizeSource(item, i));

    const title = String(config.title ?? data.label ?? "Combined report");
    const intro = String(
      config.intro ??
        "Aggregated content from upstream nodes (fan-in).",
    );
    const generatedAt = new Date().toISOString();

    const markdown = renderMarkdownReport(sources, {
      title,
      intro,
      generatedAt,
    });

    const outputPath = resolveOutputPath(config, title);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, markdown, "utf8");

    return {
      format: "markdown",
      rendered: true,
      markdown,
      sourceCount: sources.length,
      title,
      writtenTo: outputPath,
      sources: sources.map((s) => ({
        heading: s.heading,
        url: s.url,
        status: s.status,
      })),
    };
  };
}

export const createMarkdownHandler = createMarkdownOutputHandler;
export const createMarkdownReportHandler = createMarkdownOutputHandler;
