import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  GraphEngine,
  mergeLlmConfigIntoGlobalSettings,
} from "../dist/index.js";

describe("mergeLlmConfigIntoGlobalSettings", () => {
  it("maps bedrock provider, api key, model, and region", () => {
    const settings = mergeLlmConfigIntoGlobalSettings({
      provider: "bedrock",
      apiKey: "bedrock-secret",
      modelId: "us.anthropic.claude-sonnet-4-6",
      region: "us-west-2",
    });

    assert.equal(settings.llmProvider, "bedrock");
    assert.equal(settings.bedrockApiKey, "bedrock-secret");
    assert.equal(settings.modelId, "us.anthropic.claude-sonnet-4-6");
    assert.equal(settings.region, "us-west-2");
  });

  it("maps openai provider credentials", () => {
    const settings = mergeLlmConfigIntoGlobalSettings({
      provider: "openai",
      apiKey: "sk-test",
      baseUrl: "https://api.openai.com/v1",
      model: "gpt-4o",
    });

    assert.equal(settings.llmProvider, "openai");
    assert.equal(settings.llmApiKey, "sk-test");
    assert.equal(settings.llmApiBase, "https://api.openai.com/v1");
    assert.equal(settings.model, "gpt-4o");
  });

  it("lets globalSettings override llm defaults", () => {
    const settings = mergeLlmConfigIntoGlobalSettings(
      { provider: "bedrock", apiKey: "a", region: "us-east-1" },
      { region: "eu-west-1", temperature: 0.2 },
    );

    assert.equal(settings.region, "eu-west-1");
    assert.equal(settings.temperature, 0.2);
    assert.equal(settings.bedrockApiKey, "a");
  });
});

describe("GraphEngine llm option", () => {
  it("exposes merged settings via getGlobalSettings()", async () => {
    const engine = new GraphEngine({
      flow: { nodes: [{ id: "a", type: "text", data: { nodeData: "x" } }], edges: [] },
      llm: {
        provider: "bedrock",
        apiKey: "key-from-constructor",
        modelId: "custom-model",
      },
      nodeExecutor: async () => null,
    });

    const settings = engine.getGlobalSettings();
    assert.equal(settings.llmProvider, "bedrock");
    assert.equal(settings.bedrockApiKey, "key-from-constructor");
    assert.equal(settings.modelId, "custom-model");
  });

  it("passes llm settings into node.data.settings at execution", async () => {
    /** @type {Record<string, unknown> | undefined} */
    let seenSettings;

    const engine = new GraphEngine({
      flow: {
        nodes: [{ id: "g", type: "genText", data: { nodeData: "hi" } }],
        edges: [],
      },
      llm: {
        provider: "bedrock",
        bedrock: { apiKey: "injected-key", modelId: "m1" },
      },
      nodeExecutor: async (node) => {
        seenSettings = node.data?.settings;
        return "ok";
      },
    });

    await engine.run();
    assert.equal(seenSettings?.llmProvider, "bedrock");
    assert.equal(seenSettings?.bedrockApiKey, "injected-key");
    assert.equal(seenSettings?.modelId, "m1");
  });
});
