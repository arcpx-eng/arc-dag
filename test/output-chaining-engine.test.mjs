import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { GraphEngine, resolveGenTextQuery } from "../dist/index.js";
import { createNodeExecutor } from "../examples/lib/handlers/index.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pipelinePath = resolve(
  __dirname,
  "../examples/pipeline-output-chaining.json",
);

/** @type {typeof globalThis.fetch} */
let originalFetch;

function installWebpageFetchMock() {
  originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    const href = String(url);
    if (href.includes("ontario.ca")) {
      return new Response(
        "<html><head><title>Ontario Government</title></head><body><p>ONTARIO-PAGE-BODY</p></body></html>",
        {
          status: 200,
          headers: { "content-type": "text/html; charset=utf-8" },
        },
      );
    }
    if (href.includes("statutoryholidays.com")) {
      return new Response(
        "<html><head><title>Ontario Statutory Holidays</title></head><body><p>HOLIDAY-PAGE-BODY</p></body></html>",
        {
          status: 200,
          headers: { "content-type": "text/html; charset=utf-8" },
        },
      );
    }
    return originalFetch(url, init);
  };
}

describe("GraphEngine output chaining (run:output-chaining)", () => {
  before(() => {
    installWebpageFetchMock();
  });

  after(() => {
    globalThis.fetch = originalFetch;
  });

  it("webpage handler fetches upstream data; genText substitutes named placeholders", async () => {
    const raw = await readFile(pipelinePath, "utf8");
    const flow = JSON.parse(raw);
    const executor = createNodeExecutor();

    /** @type {import("../dist/flow-document.js").FlowNode | undefined} */
    let genTextExecutionNode;

    const engine = new GraphEngine({
      flow,
      llm: {
        provider: "bedrock",
        apiKey: "test-bedrock-key",
        modelId: "us.anthropic.claude-sonnet-4-6",
        region: "us-east-1",
      },
      nodeExecutor: async (node) => {
        if (node.type === "genText") {
          genTextExecutionNode = node;
          return { query: resolveGenTextQuery(node) };
        }
        return executor(node);
      },
    });

    const outputs = await engine.run();

    const fetchExample = outputs.get("fetch_example");
    const fetchWiki = outputs.get("fetch_wikipedia");

    assert.ok(fetchExample && typeof fetchExample === "object");
    assert.equal(
      /** @type {Record<string, unknown>} */ (fetchExample).outputTarget,
      "$ontario_gov",
    );
    assert.match(
      String(/** @type {Record<string, unknown>} */ (fetchExample).text),
      /ONTARIO-PAGE-BODY/,
    );
    assert.ok(
      /** @type {Record<string, unknown>} */ (fetchExample).cells?.[
        "$ontario_gov"
      ],
    );

    assert.ok(fetchWiki && typeof fetchWiki === "object");
    assert.equal(
      /** @type {Record<string, unknown>} */ (fetchWiki).outputTarget,
      "$canada_holidays",
    );
    assert.match(
      String(/** @type {Record<string, unknown>} */ (fetchWiki).text),
      /HOLIDAY-PAGE-BODY/,
    );

    assert.ok(genTextExecutionNode, "genText node should have executed");
    const sourceData = genTextExecutionNode.data?.sourceData;
    assert.ok(Array.isArray(sourceData), "sourceData should be a fan-in array");
    assert.equal(sourceData.length, 2);

    const texts = sourceData.map((p) =>
      p && typeof p === "object" && "text" in p ? String(p.text) : "",
    );
    assert.ok(
      texts.some((t) => t.includes("ONTARIO-PAGE-BODY")),
      "Ontario webpage extract should be in sourceData",
    );
    assert.ok(
      texts.some((t) => t.includes("HOLIDAY-PAGE-BODY")),
      "Holidays webpage extract should be in sourceData",
    );

    const settings = genTextExecutionNode.data?.settings;
    assert.equal(settings?.llmProvider, "bedrock");
    assert.equal(settings?.bedrockApiKey, "test-bedrock-key");
    assert.equal(settings?.modelId, "us.anthropic.claude-sonnet-4-6");

    const genOut = outputs.get("genText_we_are_canada");
    assert.ok(genOut && typeof genOut === "object" && "query" in genOut);
    const query = String(/** @type {{ query: string }} */ (genOut).query);

    assert.match(query, /ONTARIO-PAGE-BODY/);
    assert.match(query, /HOLIDAY-PAGE-BODY/);
    assert.doesNotMatch(query, /\{\$ontario_gov\}/);
    assert.doesNotMatch(query, /\{\$canada_holidays\}/);
    assert.match(query, /Ontario Government/);
    assert.match(query, /Statutory Holidays/);
  });

  it("createNodeExecutor wires webpage extension + package builtin genText settings", async () => {
    const executor = createNodeExecutor();

    /** @type {import("../dist/flow-document.js").FlowNode | undefined} */
    let genTextNode;

    const engine = new GraphEngine({
      flow: {
        nodes: [
          {
            id: "fetch_example",
            type: "webpage",
            data: {
              label: "Canada Government",
              outputTarget: "$ontario_gov",
              nodeData: {
                url: "https://www.ontario.ca/page/government-ontario",
                maxChars: 6000,
              },
            },
          },
          {
            id: "genText_we_are_canada",
            type: "genText",
            data: { nodeData: "Report\n\n{$ontario_gov}" },
          },
        ],
        edges: [
          {
            id: "e-example-gentext",
            source: "fetch_example",
            target: "genText_we_are_canada",
          },
        ],
      },
      llm: {
        provider: "bedrock",
        apiKey: "example-key",
        modelId: "m1",
      },
      nodeExecutor: async (node) => {
        if (node.type === "genText") {
          genTextNode = node;
          const query = resolveGenTextQuery(node);
          assert.match(query, /ONTARIO-PAGE-BODY/);
          assert.equal(node.data?.settings?.bedrockApiKey, "example-key");
          return { query };
        }
        return executor(node);
      },
    });

    await engine.run();
    assert.ok(genTextNode);
    assert.equal(genTextNode.data?.sourceData?.length ?? 0, 1);
    assert.match(
      String(genTextNode.data?.sourceData?.[0]?.text ?? ""),
      /ONTARIO-PAGE-BODY/,
    );
  });
});
