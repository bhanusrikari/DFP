import type { AIFinding } from "@dfp/shared";
import { prisma } from "../../db.js";
import { recordAudit } from "../audit/audit.service.js";
import { checkStructuredValues, type StructuredLabValue } from "./abnormal-rules.engine.js";
import { getAIProvider } from "./providers/index.js";

// Runs the analysis pipeline for a single report:
//   1. deterministic rule engine over structured values (instant, ground truth)
//   2. LLM call for free-text summarization/explanation (async, the slow part)
//   3. merge + persist as AIAnalysis(scope=PER_REPORT)
// This is the whole "AI is read-only input" boundary in one function — nothing
// downstream of this writes back into a decision entity.
export async function analyzeReport(reportId: string): Promise<void> {
  const report = await prisma.report.findUniqueOrThrow({ where: { id: reportId } });
  await prisma.report.update({ where: { id: reportId }, data: { status: "PROCESSING" } });

  const structuredValues: StructuredLabValue[] = report.structuredValuesJson
    ? JSON.parse(report.structuredValuesJson)
    : [];
  const ruleFindings: AIFinding[] = checkStructuredValues(structuredValues);

  const provider = getAIProvider();
  const result = await provider.analyzeReport({
    reportType: report.type,
    textContent: report.textContent ?? "",
    structuredValues,
    ruleFindings,
  });

  await prisma.aIAnalysis.create({
    data: {
      reportId: report.id,
      encounterId: report.encounterId,
      scope: "PER_REPORT",
      summaryText: result.summaryText,
      findingsJson: JSON.stringify(result.findings),
      plainLanguageExplanation: result.plainLanguageExplanation,
      modelUsed: result.modelUsed,
      promptVersion: result.promptVersion,
      rawResponse: result.rawResponse,
    },
  });

  await prisma.report.update({ where: { id: reportId }, data: { status: "ANALYZED" } });

  await recordAudit({
    entityType: "Report",
    entityId: report.id,
    action: "AI_ANALYZED",
    after: { summaryText: result.summaryText, findingCount: result.findings.length },
  });

  await maybeGenerateOverallAnalysis(report.encounterId);
}

// Once every report on an encounter has been analyzed, combine them into one
// OVERALL AIAnalysis so the Doctor Dashboard has a single "what does the AI
// see across everything" view, not N separate ones to read.
async function maybeGenerateOverallAnalysis(encounterId: string): Promise<void> {
  const reports = await prisma.report.findMany({ where: { encounterId } });
  if (reports.length === 0 || reports.some((r) => r.status !== "ANALYZED")) return;

  const perReportAnalyses = await prisma.aIAnalysis.findMany({
    where: { encounterId, scope: "PER_REPORT" },
  });
  if (perReportAnalyses.length !== reports.length) return;

  const encounter = await prisma.encounter.findUniqueOrThrow({
    where: { id: encounterId },
    include: { patient: true },
  });

  const provider = getAIProvider();
  const result = await provider.summarizeEncounter({
    patientName: encounter.patient.name,
    perReportSummaries: perReportAnalyses.map((a, i) => ({
      reportType: reports[i]!.type,
      summary: a.summaryText,
      findings: JSON.parse(a.findingsJson) as AIFinding[],
    })),
  });

  // Overall analysis is regenerated each time a new report finishes — keep at most one.
  await prisma.aIAnalysis.deleteMany({ where: { encounterId, scope: "OVERALL" } });
  await prisma.aIAnalysis.create({
    data: {
      encounterId,
      scope: "OVERALL",
      summaryText: result.summaryText,
      findingsJson: JSON.stringify(result.findings),
      plainLanguageExplanation: result.plainLanguageExplanation,
      modelUsed: result.modelUsed,
      promptVersion: result.promptVersion,
      rawResponse: result.rawResponse,
    },
  });
}
