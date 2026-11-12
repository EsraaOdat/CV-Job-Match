/**
 * Structured-output AI client. Supports two providers:
 * - Google Gemini (free tier, no billing needed): set GEMINI_API_KEY
 * - Anthropic Claude (paid): set ANTHROPIC_API_KEY
 * If both are set, AI_PROVIDER=gemini|claude picks one (default: gemini).
 */

const CLAUDE_URL = (process.env["ANTHROPIC_BASE_URL"] ?? "https://api.anthropic.com").replace(/\/+$/, "");
const GEMINI_URL = (process.env["GEMINI_BASE_URL"] ?? "https://generativelanguage.googleapis.com").replace(/\/+$/, "");

const CLAUDE_MODEL = process.env["ANTHROPIC_MODEL"] ?? "claude-sonnet-5-5";
const GEMINI_MODEL = process.env["GEMINI_MODEL"] ?? "gemini-2.5-flash";

export class MissingApiKeyError extends Error {
  constructor() {
    super("No AI API key is set on the server (GEMINI_API_KEY or ANTHROPIC_API_KEY).");
  }
}

export class AiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}
// Kept for compatibility with existing imports.
export { AiError as ClaudeError };

type Provider = "gemini" | "claude";

function activeProvider(): Provider | null {
  const gemini = Boolean(process.env["GEMINI_API_KEY"]?.trim());
  const claude = Boolean(process.env["ANTHROPIC_API_KEY"]?.trim());
  const preferred = process.env["AI_PROVIDER"]?.trim().toLowerCase();
  if (preferred === "claude" && claude) return "claude";
  if (preferred === "gemini" && gemini) return "gemini";
  if (gemini) return "gemini";
  if (claude) return "claude";
  return null;
}

export function hasApiKey(): boolean {
  return activeProvider() !== null;
}

export function activeModel(): string {
  return activeProvider() === "claude" ? CLAUDE_MODEL : GEMINI_MODEL;
}

type ToolSpec = {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
};

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: { message?: string } };
    return body.error?.message ?? "";
  } catch {
    return "";
  }
}

async function callClaude<T>(options: { system: string; prompt: string; tool: ToolSpec; maxTokens: number }): Promise<T> {
  const response = await fetch(`${CLAUDE_URL}/v1/messages`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env["ANTHROPIC_API_KEY"]!.trim(),
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: options.maxTokens,
      system: options.system,
      tools: [options.tool],
      tool_choice: { type: "tool", name: options.tool.name },
      messages: [{ role: "user", content: options.prompt }],
    }),
    signal: AbortSignal.timeout(90_000),
  });
  if (!response.ok) {
    const detail = await readError(response);
    throw new AiError(`Claude API returned HTTP ${response.status}${detail ? `: ${detail}` : ""}`, response.status);
  }
  const data = (await response.json()) as { content?: Array<{ type: string; name?: string; input?: unknown }> };
  const toolUse = data.content?.find((block) => block.type === "tool_use" && block.name === options.tool.name);
  if (!toolUse || typeof toolUse.input !== "object" || toolUse.input === null) {
    throw new AiError("Claude did not return the expected structured result.");
  }
  return toolUse.input as T;
}

function parseJsonText(text: string): unknown {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    return JSON.parse(trimmed);
  } catch {
    // Fall back to the outermost JSON object in the text.
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(trimmed.slice(start, end + 1));
    throw new AiError("The AI response was not valid JSON.");
  }
}

async function callGemini<T>(options: { system: string; prompt: string; tool: ToolSpec; maxTokens: number }): Promise<T> {
  const prompt =
    `${options.prompt}\n\n` +
    `Task: ${options.tool.description}\n` +
    `Reply with ONLY a JSON object that matches this JSON Schema:\n${JSON.stringify(options.tool.input_schema)}`;

  const response = await fetch(
    `${GEMINI_URL}/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": process.env["GEMINI_API_KEY"]!.trim(),
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: options.system }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
          // Room for the model's internal thinking plus the JSON answer.
          maxOutputTokens: Math.max(options.maxTokens * 2, 8192),
        },
      }),
      signal: AbortSignal.timeout(120_000),
    },
  );
  if (!response.ok) {
    const detail = await readError(response);
    throw new AiError(`Gemini API returned HTTP ${response.status}${detail ? `: ${detail}` : ""}`, response.status);
  }
  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string; thought?: boolean }> }; finishReason?: string }>;
  };
  const candidate = data.candidates?.[0];
  const text = (candidate?.content?.parts ?? [])
    .filter((part) => !part.thought && typeof part.text === "string")
    .map((part) => part.text)
    .join("");
  if (!text) {
    throw new AiError(`Gemini returned no text (finishReason: ${candidate?.finishReason ?? "unknown"}).`);
  }
  const parsed = parseJsonText(text);
  if (!parsed || typeof parsed !== "object") throw new AiError("The AI response was not a JSON object.");
  return parsed as T;
}

/** Calls the configured AI provider and returns JSON matching the tool's schema. */
export async function callTool<T>(options: {
  system: string;
  prompt: string;
  tool: ToolSpec;
  maxTokens?: number;
}): Promise<T> {
  const provider = activeProvider();
  if (!provider) throw new MissingApiKeyError();
  const args = { ...options, maxTokens: options.maxTokens ?? 4096 };
  return provider === "claude" ? callClaude<T>(args) : callGemini<T>(args);
}
