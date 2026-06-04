const DEFAULT_REGION = "us-east-1";
const DEFAULT_MODEL_ID = "us.anthropic.claude-sonnet-4-6";

export function formatHistoryForBedrock(
  history: unknown,
): { role: string; content: { text: string }[] }[] {
  if (!Array.isArray(history)) return [];

  const out: { role: string; content: { text: string }[] }[] = [];

  for (const msg of history) {
    if (!msg || typeof msg !== "object") continue;
    const m = msg as Record<string, unknown>;

    if (m.role && Array.isArray(m.parts)) {
      const role = m.role === "model" ? "assistant" : String(m.role);
      out.push({
        role,
        content: (m.parts as unknown[]).map((p) => ({
          text: String((p as Record<string, unknown>).text ?? ""),
        })),
      });
      continue;
    }

    if (m.role && m.content != null) {
      const role = m.role === "model" ? "assistant" : String(m.role);
      let content: { text: string }[];
      if (typeof m.content === "string") {
        content = [{ text: m.content }];
      } else if (Array.isArray(m.content)) {
        content = m.content.map((c) =>
          typeof c === "object" && c !== null && "text" in c
            ? { text: String((c as Record<string, unknown>).text) }
            : { text: String(c) },
        );
      } else {
        content = [{ text: JSON.stringify(m.content) }];
      }
      out.push({ role, content });
    }
  }

  return out;
}

export function collectHistoryFromSourceData(sourceData: unknown): unknown[] {
  const history: unknown[] = [];
  const items = Array.isArray(sourceData)
    ? sourceData
    : sourceData != null
      ? [sourceData]
      : [];

  for (const item of items) {
    if (
      item &&
      typeof item === "object" &&
      (item as Record<string, unknown>).type === "genText" &&
      Array.isArray((item as Record<string, unknown>).data)
    ) {
      history.push(...((item as Record<string, unknown>).data as unknown[]));
    } else if (item && typeof item === "object" && "role" in item) {
      history.push(item);
    }
  }

  return history;
}

export type BedrockConverseArgs = {
  query: string;
  history?: unknown[];
  apiKey?: string;
  region?: string;
  modelId?: string;
  userId?: string;
  timeoutMs?: number;
};

export async function bedrockConverse(args: BedrockConverseArgs): Promise<string> {
  const apiKey = args.apiKey ?? process.env.BEDROCK_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Bedrock apiKey is required (GraphEngine llm.bedrock.apiKey or BEDROCK_API_KEY)",
    );
  }

  const region = args.region ?? process.env.BEDROCK_REGION ?? DEFAULT_REGION;
  const modelId =
    args.modelId ?? process.env.BEDROCK_MODEL_ID ?? DEFAULT_MODEL_ID;

  const url = `https://bedrock-runtime.${region}.amazonaws.com/model/${encodeURIComponent(modelId)}/converse`;

  const messages = formatHistoryForBedrock(args.history ?? []);
  messages.push({
    role: "user",
    content: [{ text: String(args.query ?? "") }],
  });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages }),
    signal: AbortSignal.timeout(args.timeoutMs ?? 120_000),
  });

  const data = (await res.json()) as {
    output?: { message?: { content?: { text?: string }[] } };
  };

  if (!res.ok || !data.output) {
    throw new Error(`Bedrock error (${res.status}): ${JSON.stringify(data)}`);
  }

  const text = data.output?.message?.content?.[0]?.text;
  if (text == null) {
    throw new Error(
      `Bedrock response missing output.message.content[0].text: ${JSON.stringify(data)}`,
    );
  }

  return text;
}
