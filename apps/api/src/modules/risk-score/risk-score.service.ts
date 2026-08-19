import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { AIFinding } from "@dfp/shared";

// Phase-3 stretch: a genuine classical-ML signal (logistic regression trained
// offline in ml/risk_model/train.py on synthetic data — see that script for
// the training/eval code and the honest accuracy/AUROC numbers it prints).
// This file only SCORES the already-trained model: a dot product + sigmoid,
// sub-millisecond, no Python/network dependency at request time.
//
// This is advisory-only. It is never read by the discharge state machine
// (discharge-state-machine.ts) and never gates any workflow step — it exists
// purely as a badge the doctor can see, per the master plan's guardrail that
// AI/ML never decides.

interface ModelCoefficients {
  version: string;
  bias: number;
  weights: {
    ageNorm: number;
    lengthOfStayNorm: number;
    abnormalFindingsNorm: number;
    highSeverityFindingsNorm: number;
    caregiverRequired: number;
    priorEncountersNorm: number;
  };
}

const COEFFICIENTS_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), "model-coefficients.json");
const model: ModelCoefficients = JSON.parse(readFileSync(COEFFICIENTS_PATH, "utf-8"));

export interface RiskScoreInput {
  ageYears: number;
  lengthOfStayDays: number;
  findings: AIFinding[];
  caregiverRequired: boolean;
  priorEncountersCount: number;
}

export interface RiskScoreResult {
  riskScore: number; // 0-1
  band: "LOW" | "MODERATE" | "HIGH";
  modelVersion: string;
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

export function scoreDischargeRisk(input: RiskScoreInput): RiskScoreResult {
  const highSeverityCount = input.findings.filter((f) => f.severity === "HIGH").length;

  const features = {
    ageNorm: clamp01(input.ageYears / 100),
    lengthOfStayNorm: clamp01(input.lengthOfStayDays / 30),
    abnormalFindingsNorm: clamp01(input.findings.length / 10),
    highSeverityFindingsNorm: clamp01(highSeverityCount / 5),
    caregiverRequired: input.caregiverRequired ? 1 : 0,
    priorEncountersNorm: clamp01(input.priorEncountersCount / 5),
  };

  const z =
    model.bias +
    features.ageNorm * model.weights.ageNorm +
    features.lengthOfStayNorm * model.weights.lengthOfStayNorm +
    features.abnormalFindingsNorm * model.weights.abnormalFindingsNorm +
    features.highSeverityFindingsNorm * model.weights.highSeverityFindingsNorm +
    features.caregiverRequired * model.weights.caregiverRequired +
    features.priorEncountersNorm * model.weights.priorEncountersNorm;

  const riskScore = sigmoid(z);
  const band = riskScore >= 0.66 ? "HIGH" : riskScore >= 0.33 ? "MODERATE" : "LOW";

  return { riskScore, band, modelVersion: model.version };
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}
