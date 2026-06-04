/**
 * @typedef {Object} NodeHandlerConfig
 * @property {string} nodeType
 * @property {string} slug
 * @property {string} pascal
 * @property {"container" | "integration"} kind
 * @property {string} description
 * @property {string} sampleLabel
 * @property {Record<string, unknown>} [sampleNodeData]
 * @property {{ name: string, description: string }[]} envVars
 * @property {string} [implementationNotes]
 */

/**
 * @param {string} type
 */
export function toSlug(type) {
  return type
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/_/g, "-")
    .toLowerCase();
}

/**
 * @param {string} slug
 */
export function toPascal(slug) {
  return slug
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
}

/**
 * @param {NodeHandlerConfig} cfg
 */
export function buildExecutorSource(cfg) {
  const fn = `create${cfg.pascal}Handler`;
  const envComments =
    cfg.envVars.length > 0
      ? cfg.envVars
          .map((e) => ` *   ${e.name} — ${e.description || "required"}`)
          .join("\n") + "\n"
      : "";

  const implNote = cfg.implementationNotes
    ? `    // ${cfg.implementationNotes.replace(/\n/g, "\n    // ")}\n`
    : "";

  if (cfg.kind === "container") {
    return `/**
 * ${cfg.description}
 * node.type: \`${cfg.nodeType}\`
 * @see docs/node-handlers.md
 */

export function ${fn}() {
  return async function ${cfg.nodeType}Handler(node) {
    const data = node.data ?? {};
    return {
      type: "${cfg.nodeType}",
      label: data.label,
      sourceData: data.sourceData ?? null,
    };
  };
}
`;
  }

  const envChecks = cfg.envVars
    .map(
      (e) =>
        `    const ${e.name} = process.env.${e.name};\n    if (!${e.name}) {\n      throw new Error("${cfg.nodeType}: set ${e.name} in .env");\n    }`,
    )
    .join("\n\n");

  const nodeDataValidate =
    cfg.sampleNodeData && Object.keys(cfg.sampleNodeData).length > 0
      ? `    if (!config || typeof config !== "object") {
      throw new Error("${cfg.nodeType}: data.nodeData must be an object");
    }
`
      : `    // Validate data.nodeData for your integration
`;

  return `/**
 * ${cfg.description}
 * node.type: \`${cfg.nodeType}\`
${envComments} * @see docs/node-handlers.md
 */

export function ${fn}() {
  return async function ${cfg.nodeType}Handler(node) {
    const data = node.data ?? {};
    const config = data.nodeData;

${envChecks ? envChecks + "\n\n" : ""}${nodeDataValidate}${implNote}    // TODO: implement ${cfg.nodeType}
    return {
      stub: true,
      type: "${cfg.nodeType}",
      label: data.label,
      config,
      sourceData: data.sourceData ?? null,
    };
  };
}
`;
}

/**
 * @param {NodeHandlerConfig} cfg
 */
export function buildReadme(cfg) {
  const nodeDataSection =
    cfg.kind === "container"
      ? "Usually only `data.label` — no `nodeData` required."
      : formatNodeDataSection(cfg);

  const envSection =
    cfg.envVars.length === 0
      ? "_No env vars configured._"
      : cfg.envVars
          .map((e) => `- \`${e.name}\` — ${e.description || "(add description)"}`)
          .join("\n");

  return `# \`${cfg.nodeType}\`

${cfg.description}

| Field | Value |
|-------|--------|
| \`node.type\` | \`"${cfg.nodeType}"\` |
| Kind | **${cfg.kind}** |
| Handler | [\`executor.example.mjs\`](./executor.example.mjs) |

## Wire-up

Registered in [\`../registry.mjs\`](../registry.mjs).

\`\`\`bash
npm run build
node examples/run-local.mjs ./your-pipeline.json
\`\`\`

## \`nodeData\`

${nodeDataSection}

## Environment variables

${envSection}

\`\`\`bash
${cfg.envVars.map((e) => `# ${e.name}=`).join("\n") || "# (none)"}
\`\`\`
`;
}

/**
 * @param {NodeHandlerConfig} cfg
 */
function formatNodeDataSection(cfg) {
  if (!cfg.sampleNodeData || Object.keys(cfg.sampleNodeData).length === 0) {
    return "Define `data.nodeData` in the ArcPX inspector for this node type.";
  }
  return (
    "```json\n" +
    JSON.stringify(cfg.sampleNodeData, null, 2) +
    "\n```"
  );
}

/**
 * @param {NodeHandlerConfig} cfg
 */
export function buildSampleNode(cfg) {
  const base = {
    id: `${cfg.nodeType}_example`,
    type: cfg.nodeType,
    position: { x: 0, y: 0 },
    data: {
      label: cfg.sampleLabel,
    },
  };

  if (cfg.kind === "integration") {
    base.data.nodeData = cfg.sampleNodeData ?? {};
  }

  return JSON.stringify(base, null, 2) + "\n";
}

/**
 * @param {NodeHandlerConfig} cfg
 */
export function printSummary(cfg) {
  console.log("\n--- Summary ---");
  console.log(`  node.type:     ${cfg.nodeType}`);
  console.log(`  folder:        examples/node-types/${cfg.slug}/`);
  console.log(`  kind:          ${cfg.kind}`);
  console.log(`  description:   ${cfg.description}`);
  if (cfg.kind === "integration") {
    console.log(
      `  sample nodeData: ${JSON.stringify(cfg.sampleNodeData ?? {})}`,
    );
    console.log(
      `  env vars:        ${cfg.envVars.length ? cfg.envVars.map((e) => e.name).join(", ") : "(none)"}`,
    );
  }
  console.log("---------------\n");
}
