/**
 * Demo-only logging for fan-in / fan-out — does not change GraphEngine or handler outputs.
 */

import { getDataFlowTraceEntry } from "./create-local-executor.mjs";

/**
 * @param {string} flowPath
 */
export function shouldTraceDataFlow(flowPath) {
  const base = flowPath.replace(/\\/g, "/");
  return /fan-in|fan-out|output-chaining/.test(base);
}

/**
 * @param {{ subscribe: (handler: (event: { type: string, nodeId?: string }) => void) => void }} engine
 * @param {string} flowPath
 */
export function subscribeDataFlowTrace(engine, flowPath) {
  if (!shouldTraceDataFlow(flowPath)) return;

  console.log(
    "\nData flow trace (engine sourceData → node output; core library unchanged):\n",
  );

  engine.subscribe((event) => {
    if (event.type !== "node:complete" || !event.nodeId) return;

    const entry = getDataFlowTraceEntry(event.nodeId);
    if (!entry) return;

    const indent = (value) =>
      JSON.stringify(value ?? null, null, 2)
        .split("\n")
        .map((l, i) => (i === 0 ? ` ${l}` : `      ${l}`))
        .join("\n");

    console.log(`  ${event.nodeId} (${entry.type}${entry.label ? `, ${entry.label}` : ""}):`);
    console.log(`    receivedFromUpstream (engine sourceData):`, indent(entry.receivedFromUpstream));
    console.log(`    emitted (handler return):`, indent(entry.emitted));
    console.log("");
  });
}
