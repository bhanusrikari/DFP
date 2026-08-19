import { env } from "../../../config/env.js";
import type { AIProvider } from "./ai-provider.interface.js";
import { MockAIProvider } from "./mock-ai.provider.js";
import { ClaudeAIProvider } from "./claude-ai.provider.js";

let cached: AIProvider | undefined;

export function getAIProvider(): AIProvider {
  if (!cached) {
    cached = env.aiProvider === "claude" ? new ClaudeAIProvider() : new MockAIProvider();
  }
  return cached;
}
