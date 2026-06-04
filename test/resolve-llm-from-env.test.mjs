import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveLlmFromEnv } from "../examples/lib/resolve-llm-from-env.mjs";

describe("resolveLlmFromEnv", () => {
  it("maps BEDROCK_* env vars to bedrock llm config", () => {
    const llm = resolveLlmFromEnv({
      BEDROCK_API_KEY: "bk",
      BEDROCK_REGION: "ca-central-1",
      BEDROCK_MODEL_ID: "anthropic.claude-3",
    });

    assert.deepEqual(llm, {
      provider: "bedrock",
      apiKey: "bk",
      region: "ca-central-1",
      modelId: "anthropic.claude-3",
    });
  });

  it("maps LLM_API_* env vars to openai llm config", () => {
    const llm = resolveLlmFromEnv({
      LLM_API_KEY: "sk",
      LLM_API_BASE: "https://api.example.com/v1",
      LLM_MODEL: "gpt-4o",
    });

    assert.deepEqual(llm, {
      provider: "openai",
      apiKey: "sk",
      baseUrl: "https://api.example.com/v1",
      model: "gpt-4o",
    });
  });

  it("prefers bedrock when both env sets are present", () => {
    const llm = resolveLlmFromEnv({
      BEDROCK_API_KEY: "bk",
      LLM_API_KEY: "sk",
      LLM_API_BASE: "https://api.openai.com/v1",
    });

    assert.equal(llm?.provider, "bedrock");
    assert.equal(llm?.apiKey, "bk");
  });

  it("returns undefined when no credentials", () => {
    assert.equal(resolveLlmFromEnv({}), undefined);
  });
});
