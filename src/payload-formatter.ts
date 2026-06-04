/** OpenAI-style message format */
export interface BuiltInMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

/** Gemini-style message format */
export interface GeminiMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

export type ChatMessage = BuiltInMessage | GeminiMessage;

export type ServiceMode = "built-in" | "gemini" | (string & {});

export function formatChatMessage(
  serviceMode: ServiceMode,
  role: "user" | "assistant",
  text: string,
): ChatMessage {
  if (serviceMode === "built-in") {
    return { role, content: text };
  }

  return {
    role: role === "assistant" ? "model" : "user",
    parts: [{ text }],
  };
}

export function formatChatTurn(
  serviceMode: ServiceMode,
  userText: string,
  assistantText: string,
): [ChatMessage, ChatMessage] {
  return [
    formatChatMessage(serviceMode, "user", userText),
    formatChatMessage(serviceMode, "assistant", assistantText),
  ];
}

export function formatChatHistory(
  serviceMode: ServiceMode,
  turns: { input: string; output: string }[],
): ChatMessage[] {
  return turns.flatMap(({ input, output }) =>
    formatChatTurn(serviceMode, input, output),
  );
}
