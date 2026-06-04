import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import {
  GraphEngine,
  createBuiltinNodeExecutor,
  resolveGenTextQuery,
} from "../dist/index.js";

describe("createBuiltinNodeExecutor + GraphEngine llm", () => {
  /** @type {typeof globalThis.fetch} */
  let originalFetch;

  before(() => {
    originalFetch = globalThis.fetch;
  });

  after(() => {
    globalThis.fetch = originalFetch;
  });

  it("calls Bedrock using llm apiKey merged into node settings", async () => {
    globalThis.fetch = async (url, init) => {
      if (String(url).includes("bedrock-runtime")) {
        const body = JSON.parse(String(init?.body ?? "{}"));
        assert.ok(body.messages?.length > 0);
        return new Response(
          JSON.stringify({
            output: {
              message: { content: [{ text: "SYNTHESIZED REPORT" }] },
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      return originalFetch(url, init);
    };

    const engine = new GraphEngine({
      flow: {
        nodes: [
          {
            id: "gen",
            type: "genText",
            data: { nodeData: "Write a short report." },
          },
        ],
        edges: [],
      },
      llm: {
        provider: "bedrock",
        apiKey: "test-bedrock-key",
        modelId: "test-model",
        region: "us-east-1",
      },
      nodeExecutor: createBuiltinNodeExecutor(),
    });

    const outputs = await engine.run();
    assert.equal(outputs.get("gen"), "SYNTHESIZED REPORT");
  });

  it("substitutes named placeholders in prompt sent to Bedrock", async () => {
    /** @type {string | undefined} */
    let capturedQuery;

    globalThis.fetch = async (url, init) => {
      if (String(url).includes("bedrock-runtime")) {
        const body = JSON.parse(String(init?.body ?? "{}"));
        capturedQuery = body.messages?.at(-1)?.content?.[0]?.text;
        return new Response(
          JSON.stringify({
            output: { message: { content: [{ text: "ok" }] } },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      return originalFetch(url, init);
    };

    const builtin = createBuiltinNodeExecutor();
    const sourceData = [
      {
        outputTarget: "$ontario_gov",
        title: "Gov",
        url: "https://ontario.ca",
        text: "ONTARIO-EXTRACT",
      },
      {
        outputTarget: "$canada_holidays",
        title: "Hol",
        url: "https://holidays.example",
        text: "HOLIDAY-EXTRACT",
      },
    ];

    const engine = new GraphEngine({
      flow: {
        nodes: [
          {
            id: "genText_we_are_canada",
            type: "genText",
            data: {
              nodeData:
                "## Ontario\n\n{$ontario_gov}\n\n## Holidays\n\n{$canada_holidays}",
            },
          },
        ],
        edges: [],
      },
      llm: { provider: "bedrock", apiKey: "key", modelId: "m" },
      nodeExecutor: async (node) => {
        const withSource = {
          ...node,
          data: { ...node.data, sourceData },
        };
        const query = resolveGenTextQuery(withSource);
        return builtin({
          ...withSource,
          data: { ...withSource.data, nodeData: query },
        });
      },
    });

    await engine.run();
    assert.match(capturedQuery ?? "", /ONTARIO-EXTRACT/);
    assert.match(capturedQuery ?? "", /HOLIDAY-EXTRACT/);
  });
});
