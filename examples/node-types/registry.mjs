/**
 * Community & extension node handlers (not ArcPX core builtins).
 * Core types (pipeNode, genText, webpage, …) are in examples/lib/handlers/builtin.mjs
 */
import { createBigQueryHandler } from "./bigquery/executor.example.mjs";
import { createXApiHandler } from "./x-api/executor.example.mjs";
import { createAiReposHandler } from "./ai-repos/executor.example.mjs";
import {
  createMarkdownOutputHandler,
  createMarkdownHandler,
  createMarkdownReportHandler,
} from "./markdown-output/executor.example.mjs";

/** @returns {Map<string, (node: import("../../dist/flow-document.js").FlowNode) => Promise<unknown>>} */
export function loadCommunityHandlers() {
  const handlers = new Map();

  handlers.set("bigQuery", createBigQueryHandler());
  handlers.set("xApi", createXApiHandler());
  handlers.set("markdownOutput", createMarkdownOutputHandler());
  handlers.set("markdown", createMarkdownHandler());
  handlers.set("markdownReport", createMarkdownReportHandler());

  // --- GENERATED:HANDLERS:START ---
  handlers.set("aiRepos", createAiReposHandler());
  // --- GENERATED:HANDLERS:END ---

  return handlers;
}
