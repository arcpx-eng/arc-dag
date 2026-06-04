import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { bedrockConverse, collectHistoryFromSourceData } from "./bedrock-converse.js";
import type { FlowNode } from "./flow-document.js";
import { resolveGenTextQuery } from "./gen-text-query.js";
import type { LlmProviderName } from "./llm-config.js";

async function maybeWriteOutput(
  node: FlowNode,
  text: string,
): Promise<string | { text: string; writtenTo: string }> {
  const data = node.data ?? {};
  const settings =
    data.settings && typeof data.settings === "object"
      ? (data.settings as Record<string, unknown>)
      : {};
  const config =
    data.nodeData && typeof data.nodeData === "object"
      ? (data.nodeData as Record<string, unknown>)
      : {};
  const outputPath = settings.outputPath ?? config.outputPath;
  if (!outputPath) return text;

  const path = resolve(String(outputPath));
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, text, "utf8");
  return { text, writtenTo: path };
}

async function openAiChatComplete(args: {
  prompt: string;
  systemPrompt?: string;
  apiKey: string;
  baseUrl: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<string> {
  const base = args.baseUrl.replace(/\/$/, "");
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: args.model ?? "gpt-4o",
      messages: [
        ...(args.systemPrompt
          ? [{ role: "system", content: args.systemPrompt }]
          : []),
        { role: "user", content: args.prompt },
      ],
      temperature: args.temperature,
      max_tokens: args.maxTokens,
    }),
  });

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
    error?: { message?: string };
  };

  if (!res.ok) {
    throw new Error(
      `OpenAI-compatible error (${res.status}): ${data.error?.message ?? JSON.stringify(data)}`,
    );
  }

  const text = data.choices?.[0]?.message?.content;
  if (text == null) {
    throw new Error(`OpenAI-compatible response missing content: ${JSON.stringify(data)}`);
  }
  return text;
}

function settingsRecord(node: FlowNode): Record<string, unknown> {
  const data = node.data ?? {};
  return data.settings && typeof data.settings === "object"
    ? (data.settings as Record<string, unknown>)
    : {};
}

function nodeConfig(node: FlowNode): Record<string, unknown> {
  const data = node.data ?? {};
  return data.nodeData && typeof data.nodeData === "object"
    ? (data.nodeData as Record<string, unknown>)
    : {};
}

function resolveProvider(settings: Record<string, unknown>): LlmProviderName | undefined {
  const p = settings.llmProvider;
  if (p === "bedrock" || p === "openai") return p;
  return undefined;
}

export async function runGenTextNode(node: FlowNode): Promise<unknown> {
  const settings = settingsRecord(node);
  const config = nodeConfig(node);

  const query = resolveGenTextQuery(node);
  if (!query.trim()) {
    throw new Error("genText requires data.nodeData (string prompt)");
  }

  const history = collectHistoryFromSourceData(node.data?.sourceData);
  const provider = resolveProvider(settings);

  const bedrockKey =
    (config.apiKey as string | undefined) ??
    (settings.bedrockApiKey as string | undefined) ??
    process.env.BEDROCK_API_KEY;

  const openAiKey =
    (settings.llmApiKey as string | undefined) ?? process.env.LLM_API_KEY;
  const openAiBase =
    (settings.llmApiBase as string | undefined) ?? process.env.LLM_API_BASE;

  if ((provider === "bedrock" || (!provider && bedrockKey)) && bedrockKey) {
    const text = await bedrockConverse({
      query,
      history,
      apiKey: bedrockKey,
      region:
        (config.region as string | undefined) ??
        (settings.region as string | undefined),
      modelId:
        (config.modelId as string | undefined) ??
        (settings.modelId as string | undefined) ??
        (settings.model as string | undefined),
      userId:
        (config.userId as string | undefined) ??
        (settings.userId as string | undefined),
      timeoutMs:
        (config.timeoutMs as number | undefined) ??
        (settings.timeoutMs as number | undefined),
    });
    return maybeWriteOutput(node, text);
  }

  if (
    (provider === "openai" || (!provider && !bedrockKey)) &&
    openAiKey &&
    openAiBase
  ) {
    const text = await openAiChatComplete({
      prompt: query,
      systemPrompt: String(settings.systemPrompt ?? ""),
      apiKey: openAiKey,
      baseUrl: openAiBase,
      model:
        (settings.model as string | undefined) ?? process.env.LLM_MODEL,
      temperature: settings.temperature as number | undefined,
      maxTokens: settings.maxOutputTokens as number | undefined,
    });
    return maybeWriteOutput(node, text);
  }

  throw new Error(
    'genText requires GraphEngine llm config (provider "bedrock" + apiKey, or provider "openai" + apiKey + baseUrl) or env BEDROCK_API_KEY / LLM_API_*',
  );
}
