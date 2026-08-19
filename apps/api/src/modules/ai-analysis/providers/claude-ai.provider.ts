import Anthropic from "@anthropic-ai/sdk";
import { env } from "../../../config/env.js";
import type {
  AIProvider,
  AnalyzeReportInput,
  AnalyzeReportOutput,
  SummarizeEncounterInput,
} from "./ai-provider.interface.js";

const PROMPT_VERSION = "claude-v1";
const MODEL = "claude-sonnet-4-5-20250929";

const SYSTEM_PROMPT = `You are a clinical documentation assistant helping a hospital care team review discharge readiness.

Strict rules:
- Summarize and explain report content in plain language. Do NOT diagnose. Do NOT recommend whether the patient should be discharged. Do NOT state a medical decision.
- Only describe what is in the provided text/values. Do not infer information that is not present.
- Findings must stay descriptive ("value X is outside the typical range") not prescriptive ("patient needs treatment Y").
- A doctor will review and verify everything you produce before any decision is made — your output is an input to their judgment, never a substitute for it.

Always respond by calling the "submit_analysis" tool with your structured output.`;

const ANALYSIS_TOOL: Anthropic.Tool = {
  name: "submit_analysis",
  description: "Submit the structured report analysis.",
  input_schema: {
    type: "object",
    properties: {
      summaryText: { type: "string", description: "1-3 sentence factual summary of the report." },
      findings: {
        type: "array",
        items: {
          type: "object",
          properties: {
            finding: { type: "string" },
            value: { type: "string" },
            referenceRange: { type: "string" },
            severity: { type: "string", enum: ["LOW", "MODERATE", "HIGH"] },
          },
          required: ["finding", "severity"],
        },
      },
      plainLanguageExplanation: {
        type: "string",
        description: "Plain-language explanation a non-clinical reader (or the care team) can understand.",
      },
    },
    required: ["summaryText", "findings", "plainLanguageExplanation"],
  },
};

// Real LLM implementation. Server-side only (this file is never imported by
// apps/web) — the API key never reaches the client, and every call/response
// is persisted by ai-analysis.service.ts for audit.
export class ClaudeAIProvider implements AIProvider {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({ apiKey: env.anthropicApiKey });
  }

  async analyzeReport(input: AnalyzeReportInput): Promise<AnalyzeReportOutput> {
    const userContent = [
      `Report type: ${input.reportType}`,
      input.structuredValues.length
        ? `Structured values: ${JSON.stringify(input.structuredValues)}`
        : undefined,
      input.ruleFindings.length
        ? `Already-flagged out-of-range values (from a deterministic reference-range check, treat as ground truth): ${JSON.stringify(
            input.ruleFindings
          )}`
        : undefined,
      input.textContent ? `Report text:\n${input.textContent}` : undefined,
    ]
      .filter(Boolean)
      .join("\n\n");

    return this.callModel(userContent);
  }

  async summarizeEncounter(input: SummarizeEncounterInput): Promise<AnalyzeReportOutput> {
    const userContent = `Patient: ${input.patientName}\n\nPer-report summaries so far:\n${input.perReportSummaries
      .map((r) => `- [${r.reportType}] ${r.summary} (findings: ${JSON.stringify(r.findings)})`)
      .join("\n")}\n\nProduce one combined overall summary across all reports.`;

    return this.callModel(userContent);
  }

  private async callModel(userContent: string): Promise<AnalyzeReportOutput> {
    const response = await this.client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      temperature: 0, // determinism matters more than creativity for clinical summaries
      system: SYSTEM_PROMPT,
      tools: [ANALYSIS_TOOL],
      tool_choice: { type: "tool", name: "submit_analysis" },
      messages: [{ role: "user", content: userContent }],
    });

    const toolUse = response.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
    );
    if (!toolUse) {
      throw new Error("Claude did not return a structured tool_use response");
    }

    const parsed = toolUse.input as {
      summaryText: string;
      findings: AnalyzeReportOutput["findings"];
      plainLanguageExplanation: string;
    };

    return {
      summaryText: parsed.summaryText,
      findings: parsed.findings,
      plainLanguageExplanation: parsed.plainLanguageExplanation,
      modelUsed: MODEL,
      promptVersion: PROMPT_VERSION,
      rawResponse: JSON.stringify(response),
    };
  }
}
