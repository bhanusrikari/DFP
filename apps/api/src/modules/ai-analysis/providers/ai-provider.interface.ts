import type { AIAnalysisResult, AIFinding } from "@dfp/shared";
import type { StructuredLabValue } from "../abnormal-rules.engine.js";

export interface AnalyzeReportInput {
  reportType: string;
  textContent: string;
  structuredValues: StructuredLabValue[];
  ruleFindings: AIFinding[]; // already-computed deterministic findings, given as context
}

export interface AnalyzeReportOutput extends AIAnalysisResult {
  modelUsed: string;
  promptVersion: string;
  rawResponse: string;
}

export interface SummarizeEncounterInput {
  patientName: string;
  perReportSummaries: { reportType: string; summary: string; findings: AIFinding[] }[];
}

// The one seam every LLM call goes through. Both implementations return the
// same shape so the rest of the app never knows which one is running.
export interface AIProvider {
  analyzeReport(input: AnalyzeReportInput): Promise<AnalyzeReportOutput>;
  summarizeEncounter(input: SummarizeEncounterInput): Promise<AnalyzeReportOutput>;
}
