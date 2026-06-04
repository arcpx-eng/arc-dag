/** LLM backend for `genText` / `LLM` / `llm` nodes. */
export type LlmProviderName = "bedrock" | "openai";

/** AWS Bedrock Converse (Bearer token). */
export type BedrockLlmConfig = {
  apiKey: string;
  region?: string;
  modelId?: string;
  timeoutMs?: number;
  userId?: string;
};

/** OpenAI-compatible chat completions API. */
export type OpenAiLlmConfig = {
  apiKey: string;
  baseUrl: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  systemPrompt?: string;
};

/**
 * Pass to `GraphEngine({ llm })` — merged into each node's `data.settings` at run time.
 *
 * Shorthand (provider + top-level keys):
 * ```ts
 * { provider: "bedrock", apiKey: "…", modelId: "us.anthropic.claude-sonnet-4-6", region: "us-east-1" }
 * ```
 *
 * Or nested:
 * ```ts
 * { provider: "bedrock", bedrock: { apiKey: "…", modelId: "…" } }
 * ```
 */
export type LlmConfig = {
  provider: LlmProviderName;
  bedrock?: BedrockLlmConfig;
  openai?: OpenAiLlmConfig;
  /** Shorthand when `provider` is `"bedrock"`. */
  apiKey?: string;
  modelId?: string;
  region?: string;
  timeoutMs?: number;
  /** Shorthand when `provider` is `"openai"`. */
  baseUrl?: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  systemPrompt?: string;
};

function resolvedBedrock(llm: LlmConfig): BedrockLlmConfig | undefined {
  if (llm.provider !== "bedrock") return undefined;
  const nested = llm.bedrock;
  const apiKey = nested?.apiKey ?? llm.apiKey;
  if (!apiKey) return undefined;
  return {
    apiKey,
    region: nested?.region ?? llm.region,
    modelId: nested?.modelId ?? llm.modelId,
    timeoutMs: nested?.timeoutMs ?? llm.timeoutMs,
    userId: nested?.userId,
  };
}

function resolvedOpenAi(llm: LlmConfig): OpenAiLlmConfig | undefined {
  if (llm.provider !== "openai") return undefined;
  const nested = llm.openai;
  const apiKey = nested?.apiKey ?? llm.apiKey;
  const baseUrl = nested?.baseUrl ?? llm.baseUrl;
  if (!apiKey || !baseUrl) return undefined;
  return {
    apiKey,
    baseUrl,
    model: nested?.model ?? llm.model,
    temperature: nested?.temperature ?? llm.temperature,
    maxOutputTokens: nested?.maxOutputTokens ?? llm.maxOutputTokens,
    systemPrompt: nested?.systemPrompt ?? llm.systemPrompt,
  };
}

/**
 * Merge `GraphEngine` `llm` config into `globalSettings` for node handlers.
 * `globalSettings` wins on key conflicts (explicit overrides).
 */
export function mergeLlmConfigIntoGlobalSettings(
  llm: LlmConfig | undefined,
  globalSettings: Record<string, unknown> = {},
): Record<string, unknown> {
  if (!llm) return { ...globalSettings };

  /** @type {Record<string, unknown>} */
  const fromLlm: Record<string, unknown> = {
    llmProvider: llm.provider,
  };

  const bedrock = resolvedBedrock(llm);
  if (bedrock) {
    fromLlm.bedrockApiKey = bedrock.apiKey;
    if (bedrock.region) fromLlm.region = bedrock.region;
    if (bedrock.modelId) fromLlm.modelId = bedrock.modelId;
    if (bedrock.timeoutMs != null) fromLlm.timeoutMs = bedrock.timeoutMs;
    if (bedrock.userId) fromLlm.userId = bedrock.userId;
  }

  const openai = resolvedOpenAi(llm);
  if (openai) {
    fromLlm.llmApiKey = openai.apiKey;
    fromLlm.llmApiBase = openai.baseUrl;
    if (openai.model) fromLlm.model = openai.model;
    if (openai.temperature != null) fromLlm.temperature = openai.temperature;
    if (openai.maxOutputTokens != null) {
      fromLlm.maxOutputTokens = openai.maxOutputTokens;
    }
    if (openai.systemPrompt) fromLlm.systemPrompt = openai.systemPrompt;
  }

  return { ...fromLlm, ...globalSettings };
}
