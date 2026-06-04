/**
 * Minimal OpenAI-compatible chat client for async-dag nodeExecutor.
 * Works with OpenAI, Azure OpenAI, Ollama (/v1), LM Studio, vLLM, etc.
 *
 * Env (required unless overridden in globalSettings):
 *   LLM_API_BASE   — e.g. https://api.openai.com/v1
 *   LLM_API_KEY    — bearer token (use "ollama" for local Ollama if ignored)
 *
 * Optional:
 *   LLM_MODEL      — default model if not in node.data.settings
 */

export async function chatComplete({
  prompt,
  systemPrompt = "You are a helpful assistant",
  history = [],
  model,
  temperature = 0.5,
  maxTokens = 4096,
  apiBase = process.env.LLM_API_BASE,
  apiKey = process.env.LLM_API_KEY,
}) {
  if (!apiBase) {
    throw new Error("Set LLM_API_BASE (e.g. https://api.openai.com/v1)");
  }
  if (!apiKey) {
    throw new Error("Set LLM_API_KEY");
  }
  if (!model) {
    throw new Error("Set model in globalSettings or LLM_MODEL env");
  }

  const messages = [
    { role: "system", content: systemPrompt },
    ...normalizeHistory(history),
    { role: "user", content: String(prompt ?? "") },
  ];

  const url = `${apiBase.replace(/\/$/, "")}/chat/completions`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: Number(temperature),
      max_tokens: Number(maxTokens),
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`LLM ${res.status}: ${errText}`);
  }

  const json = await res.json();
  const content = json.choices?.[0]?.message?.content;
  if (content == null) {
    throw new Error("LLM response missing choices[0].message.content");
  }
  return content;
}

/** Flatten async-dag sourceData / chat history into OpenAI-style messages. */
function normalizeHistory(sourceData) {
  const messages = [];
  const items = Array.isArray(sourceData) ? sourceData : sourceData ? [sourceData] : [];

  for (const item of items) {
    if (item?.type === "genText" && Array.isArray(item.data)) {
      for (const turn of item.data) {
        if (turn?.role && turn.content != null) {
          messages.push({ role: turn.role, content: String(turn.content) });
        } else if (turn?.role && turn.parts) {
          const text = turn.parts.map((p) => p.text).join("");
          messages.push({
            role: turn.role === "model" ? "assistant" : turn.role,
            content: text,
          });
        }
      }
    } else if (typeof item === "string") {
      messages.push({ role: "assistant", content: item });
    } else if (item != null) {
      messages.push({
        role: "assistant",
        content: typeof item === "object" ? JSON.stringify(item) : String(item),
      });
    }
  }
  return messages;
}
