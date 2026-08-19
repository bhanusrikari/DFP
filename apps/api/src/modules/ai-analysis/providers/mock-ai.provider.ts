import type { AIFinding } from "@dfp/shared";
import type {
  AIProvider,
  AnalyzeReportInput,
  AnalyzeReportOutput,
  SummarizeEncounterInput,
} from "./ai-provider.interface.js";

const PROMPT_VERSION = "mock-v1";

function severityWord(findings: AIFinding[]): string {
  if (findings.some((f) => f.severity === "HIGH")) return "significant";
  if (findings.some((f) => f.severity === "MODERATE")) return "mild";
  return "no notable";
}

// Deterministic stand-in for the real LLM call — no network, no API key,
// runs the full pipeline today. Swap AI_PROVIDER=claude for the real thing;
// see claude-ai.provider.ts for the exact same output contract.
export class MockAIProvider implements AIProvider {
  async analyzeReport(input: AnalyzeReportInput): Promise<AnalyzeReportOutput> {
    await simulateLatency();

    const { ruleFindings, reportType, textContent } = input;
    const textFindings = extractTextFindings(textContent);
    const allFindings = [...ruleFindings, ...textFindings];

    const summaryText = allFindings.length
      ? `${reportType.replace("_", " ")} report shows ${severityWord(allFindings)} findings: ${allFindings
          .map((f) => f.finding)
          .join("; ")}.`
      : `${reportType.replace("_", " ")} report reviewed — all captured values are within normal reference ranges.`;

    const plainLanguageExplanation = allFindings.length
      ? `In simple terms: ${allFindings.length} value(s) fall outside the usual healthy range. This does not by itself mean something is wrong — the doctor will interpret it alongside the full clinical picture.`
      : "In simple terms: nothing in this report stands out as abnormal based on the values provided.";

    return {
      summaryText,
      findings: allFindings,
      plainLanguageExplanation,
      modelUsed: "mock-analyzer",
      promptVersion: PROMPT_VERSION,
      rawResponse: JSON.stringify({ summaryText, allFindings }),
    };
  }

  async summarizeEncounter(input: SummarizeEncounterInput): Promise<AnalyzeReportOutput> {
    await simulateLatency();

    const allFindings = input.perReportSummaries.flatMap((r) => r.findings);
    const summaryText = `Overall review across ${input.perReportSummaries.length} report(s) for ${input.patientName}: ${
      allFindings.length
        ? `${allFindings.length} abnormal finding(s) identified across reports.`
        : "no abnormal findings identified across reports."
    }`;

    const plainLanguageExplanation = allFindings.length
      ? `Across all the reports reviewed, ${allFindings.length} value(s) were outside normal range. Please review each report's detail before confirming discharge readiness.`
      : "Across all the reports reviewed, nothing appears abnormal. Please still confirm against your own clinical judgment.";

    return {
      summaryText,
      findings: allFindings,
      plainLanguageExplanation,
      modelUsed: "mock-analyzer",
      promptVersion: PROMPT_VERSION,
      rawResponse: JSON.stringify({ summaryText, allFindings }),
    };
  }
}

// A tiny keyword scan over free-text notes so the mock provider produces
// something plausible even without a real LLM. Real language understanding
// is exactly what ClaudeAIProvider adds — this is not meant to replace it.
function extractTextFindings(textContent: string): AIFinding[] {
  const findings: AIFinding[] = [];
  const lower = textContent.toLowerCase();
  const keywords: { term: string; severity: "LOW" | "MODERATE" | "HIGH" }[] = [
    { term: "fever", severity: "MODERATE" },
    { term: "pain", severity: "LOW" },
    { term: "shortness of breath", severity: "HIGH" },
    { term: "infection", severity: "HIGH" },
    { term: "abnormal", severity: "MODERATE" },
  ];
  for (const { term, severity } of keywords) {
    if (lower.includes(term)) {
      findings.push({ finding: `Clinical note mentions "${term}"`, severity });
    }
  }
  return findings;
}

function simulateLatency(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 400 + Math.random() * 400));
}
