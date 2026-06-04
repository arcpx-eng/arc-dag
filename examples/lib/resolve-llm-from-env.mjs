/**
 * Map local .env / process.env to GraphEngine `llm` config.
 * Used by example runners; npm consumers typically pass `llm` in application code.
 *
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {import("../../dist/llm-config.js").LlmConfig | undefined}
 */
export function resolveLlmFromEnv(env = process.env) {
  if (env.BEDROCK_API_KEY) {
    /** @type {import("../../dist/llm-config.js").LlmConfig} */
    const llm = {
      provider: "bedrock",
      apiKey: env.BEDROCK_API_KEY,
    };
    if (env.BEDROCK_REGION) llm.region = env.BEDROCK_REGION;
    if (env.BEDROCK_MODEL_ID) llm.modelId = env.BEDROCK_MODEL_ID;
    return llm;
  }

  if (env.LLM_API_KEY && env.LLM_API_BASE) {
    /** @type {import("../../dist/llm-config.js").LlmConfig} */
    const llm = {
      provider: "openai",
      apiKey: env.LLM_API_KEY,
      baseUrl: env.LLM_API_BASE,
    };
    if (env.LLM_MODEL) llm.model = env.LLM_MODEL;
    return llm;
  }

  return undefined;
}
