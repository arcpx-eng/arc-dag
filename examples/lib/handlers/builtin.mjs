/**
 * Example-only handlers not in the core package builtin executor.
 * Core types (genText, pipeNode, text, …) → createBuiltinNodeExecutor() from "arc-dag".
 */

import { createWebpageHandler } from "../../node-types/web-scraper/executor.example.mjs";
import { chatComplete } from "../chat-completions.example.mjs";

/** ArcPX + example node.type values */
export const CORE_NODE_TYPES = [
  "text",
  "startNode",
  "endNode",
  "standardOutput",
  "groupNode",
  "pipeNode",
  "webpage",
  "webScraper",
  "genText",
  "LLM",
  "llm",
  "chat",
];

/**
 * Handlers layered on top of package createBuiltinNodeExecutor().
 *
 * @returns {Map<string, (node: import("../../../dist/flow-document.js").FlowNode) => Promise<unknown>>}
 */
export function buildExtensionHandlers() {
  const webpage = createWebpageHandler();

  const openAiLlm = async (node) => {
    const data = node.data ?? {};
    const settings = {
      ...(data.settings && typeof data.settings === "object" ? data.settings : {}),
    };
    return chatComplete({
      prompt: data.nodeData,
      systemPrompt: settings.systemPrompt,
      history: data.sourceData,
      model: settings.model ?? process.env.LLM_MODEL,
      temperature: settings.temperature,
      maxTokens: settings.maxOutputTokens,
      apiKey: settings.llmApiKey,
      apiBase: settings.llmApiBase,
    });
  };

  return new Map([
    ["webpage", webpage],
    ["webScraper", webpage],
    ["llm", openAiLlm],
    ["chat", openAiLlm],
  ]);
}

/** @deprecated Use buildExtensionHandlers */
export const buildBuiltinHandlers = buildExtensionHandlers;
