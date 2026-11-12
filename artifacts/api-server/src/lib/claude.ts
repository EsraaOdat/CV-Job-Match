const API_URL = (process.env["ANTHROPIC_BASE_URL"] ?? "https://api.anthropic.com").replace(/\/+$/, "");

export const CLAUDE_MODEL = process.env["ANTHROPIC_MODEL"] ?? "claude-sonnet-5-5";

export class MissingApiKeyError extends Error {
  constructor() {
    super("ANTHROPIC_API_KEY is not set on the server.");
  }
}

export class ClaudeError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

export function hasApiKey(): boolean {
  return Boolean(process.env["ANTHROPIC_API_KEY"]?.trim());
}

type ToolSpec = {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
};

/**
 * Calls Claude and forces it to answer through a single tool, so the
 * result is always structured JSON matching the tool's input schema.
 */
export async function callTool<T>(options: {
  system: string;
  prompt: string;
  tool: ToolSpec;
  maxTokens?: number;
}): Promise<T> {
  const apiKey = process.env["ANTHROPIC_API_KEY"]?.trim();
  if (!apiKey) throw new MissingApiKeyError();

  const response = await fetch(`${API_URL}/v1/messages`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: options.maxTokens ?? 4096,
      system: options.system,
      tools: [options.tool],
      tool_choice: { type: "tool", name: options.tool.name },
      messages: [{ role: "user", content: options.prompt }],
    }),
    signal: AbortSignal.timeout(90_000),
  });

  if (!response.ok) {
    let detail = "";
    try {
      const body = (await response.json()) as { error?: { message?: string } };
      detail = body.error?.message ?? "";
    } catch {
      // Body was not JSON; keep the status only.
    }
    throw new ClaudeError(
      `Claude API returned HTTP ${response.status}${detail ? `: ${detail}` : ""}`,
      response.status,
    );
  }

  const data = (await response.json()) as {
    content?: Array<{ type: string; name?: string; input?: unknown }>;
  };
  const toolUse = data.content?.find(
    (block) => block.type === "tool_use" && block.name === options.tool.name,
  );
  if (!toolUse || typeof toolUse.input !== "object" || toolUse.input === null) {
    throw new ClaudeError("Claude did not return the expected structured result.");
  }
  return toolUse.input as T;
}
