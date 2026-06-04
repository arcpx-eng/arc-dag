import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeOutputTargetKey,
  collectNamedSourceVars,
  resolveGenTextQuery,
} from "../dist/index.js";

/** Mirrors webpage output after fetch (see web-scraper executor). */
function webpageUpstream({ target, text, title, url }) {
  const payload = {
    label: title,
    url,
    title,
    text,
    status: 200,
  };
  return {
    ...payload,
    outputTarget: target,
    cells: { [target]: { ...payload } },
  };
}

describe("normalizeOutputTargetKey", () => {
  it("strips leading $ for placeholder names", () => {
    assert.equal(normalizeOutputTargetKey("$ontario_gov"), "ontario_gov");
    assert.equal(normalizeOutputTargetKey("canada_holidays"), "canada_holidays");
  });
});

describe("collectNamedSourceVars", () => {
  it("maps outputTarget on each upstream part", () => {
    const parts = [
      webpageUpstream({
        target: "$ontario_gov",
        text: "ONTARIO-EXTRACT",
        title: "Gov",
        url: "https://ontario.ca",
      }),
      webpageUpstream({
        target: "$canada_holidays",
        text: "HOLIDAY-EXTRACT",
        title: "Hol",
        url: "https://holidays.example",
      }),
    ];

    const vars = collectNamedSourceVars(parts);
    assert.match(vars.ontario_gov, /ONTARIO-EXTRACT/);
    assert.match(vars.canada_holidays, /HOLIDAY-EXTRACT/);
  });
});

describe("resolveGenTextQuery", () => {
  const pipelinePrompt =
    'Report intro.\n\n## Ontario government\n\n{$ontario_gov}\n\n## Canada statutory holidays\n\n{$canada_holidays}';

  const sourceData = [
    webpageUpstream({
      target: "$ontario_gov",
      text: "ONTARIO-EXTRACT",
      title: "Gov",
      url: "https://ontario.ca",
    }),
    webpageUpstream({
      target: "$canada_holidays",
      text: "HOLIDAY-EXTRACT",
      title: "Hol",
      url: "https://holidays.example",
    }),
  ];

  it("substitutes named variables from upstream sourceData into nodeData", () => {
    const query = resolveGenTextQuery({
      id: "genText_we_are_canada",
      type: "genText",
      data: {
        nodeData: pipelinePrompt,
        sourceData,
      },
    });

    assert.match(query, /ONTARIO-EXTRACT/);
    assert.match(query, /HOLIDAY-EXTRACT/);
    assert.doesNotMatch(query, /\{\$ontario_gov\}/);
    assert.doesNotMatch(query, /\{\$canada_holidays\}/);
    assert.match(query, /## Ontario government/);
    assert.match(query, /## Canada statutory holidays/);
  });

  it("still supports {$upstream} and {$source_n}", () => {
    const query = resolveGenTextQuery({
      id: "gen",
      type: "genText",
      data: {
        nodeData: "All:\n{$upstream}\n\nFirst:\n{$source_1}",
        sourceData,
      },
    });

    assert.match(query, /ONTARIO-EXTRACT/);
    assert.match(query, /HOLIDAY-EXTRACT/);
    assert.doesNotMatch(query, /\{\$upstream\}/);
  });

  it("resolves pipeNode cells (ArcPX outputTarget)", () => {
    const query = resolveGenTextQuery({
      id: "gen",
      type: "genText",
      data: {
        nodeData: "JSON:\n{$adaptive_json_agent}",
        sourceData: [
          {
            type: "pipeNode",
            outputTarget: "$adaptive_json_agent",
            cells: {
              $adaptive_json_agent: [{ t: "2024-01-01", h: "Head", c: "Body" }],
            },
          },
        ],
      },
    });

    assert.match(query, /"h": "Head"/);
    assert.doesNotMatch(query, /\{\$adaptive_json_agent\}/);
  });
});
