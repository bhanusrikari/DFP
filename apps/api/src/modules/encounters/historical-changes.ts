import { findReferenceRange } from "../ai-analysis/reference-ranges.js";

// Feature: Historical Change Detection. Deterministic diff against the
// patient's previous visit — not a model call, so it's fast and explainable.
// Only surfaces MEANINGFUL changes (crosses reference range, or a real
// magnitude shift), not every field that technically differs.

export interface LabChange {
  kind: "LAB";
  test: string;
  previous: string;
  current: string;
  direction: "INCREASED" | "DECREASED";
  status: "IMPROVED" | "WORSENED" | "CHANGED";
}
export interface MedicationChange {
  kind: "MEDICATION";
  medicineName: string;
  status: "ADDED" | "REMOVED";
}
export interface FindingsTrendChange {
  kind: "FINDINGS_TREND";
  previousCount: number;
  currentCount: number;
  status: "IMPROVED" | "WORSENED";
}

export type HistoricalChange = LabChange | MedicationChange | FindingsTrendChange;

export interface HistoricalComparison {
  hasPreviousVisit: boolean;
  previousVisitDate: string | null;
  currentVisitDate: string;
  changes: HistoricalChange[];
}

interface StructuredValue {
  test: string;
  value: number;
  unit: string;
}

function latestValuesByTest(reports: { structuredValuesJson: string | null }[]): Map<string, StructuredValue> {
  const map = new Map<string, StructuredValue>();
  for (const report of reports) {
    if (!report.structuredValuesJson) continue;
    const values: StructuredValue[] = JSON.parse(report.structuredValuesJson);
    for (const v of values) map.set(v.test, v); // later report wins if duplicated
  }
  return map;
}

export function computeHistoricalChanges(
  current: {
    admissionDate: Date;
    reports: { structuredValuesJson: string | null }[];
    prescriptions: { medicineName: string }[];
    aiAnalyses: { scope: string; findingsJson: string }[];
  },
  previous: {
    admissionDate: Date;
    reports: { structuredValuesJson: string | null }[];
    prescriptions: { medicineName: string }[];
    aiAnalyses: { scope: string; findingsJson: string }[];
  } | null
): HistoricalComparison {
  if (!previous) {
    return { hasPreviousVisit: false, previousVisitDate: null, currentVisitDate: current.admissionDate.toISOString(), changes: [] };
  }

  const changes: HistoricalChange[] = [];

  const prevValues = latestValuesByTest(previous.reports);
  const currValues = latestValuesByTest(current.reports);
  for (const [test, curr] of currValues) {
    const prev = prevValues.get(test);
    if (!prev) continue;
    const pctChange = prev.value === 0 ? 0 : Math.abs(curr.value - prev.value) / Math.abs(prev.value);
    const range = findReferenceRange(test);
    const crossedRange = range ? (curr.value < range.low || curr.value > range.high) !== (prev.value < range.low || prev.value > range.high) : false;
    if (pctChange < 0.05 && !crossedRange) continue; // not meaningful

    const direction: "INCREASED" | "DECREASED" = curr.value > prev.value ? "INCREASED" : "DECREASED";
    let status: LabChange["status"] = "CHANGED";
    if (range) {
      const wasOut = prev.value < range.low || prev.value > range.high;
      const isOut = curr.value < range.low || curr.value > range.high;
      if (wasOut && !isOut) status = "IMPROVED";
      else if (!wasOut && isOut) status = "WORSENED";
      else if (wasOut && isOut) {
        const prevDist = prev.value < range.low ? range.low - prev.value : prev.value - range.high;
        const currDist = curr.value < range.low ? range.low - curr.value : curr.value - range.high;
        status = currDist < prevDist ? "IMPROVED" : "WORSENED";
      }
    }

    changes.push({
      kind: "LAB",
      test,
      previous: `${prev.value} ${prev.unit}`,
      current: `${curr.value} ${curr.unit}`,
      direction,
      status,
    });
  }

  const prevMeds = new Set(previous.prescriptions.map((p) => p.medicineName.toLowerCase()));
  const currMeds = new Set(current.prescriptions.map((p) => p.medicineName.toLowerCase()));
  for (const p of current.prescriptions) {
    if (!prevMeds.has(p.medicineName.toLowerCase())) changes.push({ kind: "MEDICATION", medicineName: p.medicineName, status: "ADDED" });
  }
  for (const p of previous.prescriptions) {
    if (!currMeds.has(p.medicineName.toLowerCase())) changes.push({ kind: "MEDICATION", medicineName: p.medicineName, status: "REMOVED" });
  }

  const countFindings = (analyses: { scope: string; findingsJson: string }[]) => {
    const overall = analyses.find((a) => a.scope === "OVERALL");
    if (!overall) return 0;
    return (JSON.parse(overall.findingsJson) as unknown[]).length;
  };
  const prevCount = countFindings(previous.aiAnalyses);
  const currCount = countFindings(current.aiAnalyses);
  if (prevCount !== currCount && (prevCount > 0 || currCount > 0)) {
    changes.push({ kind: "FINDINGS_TREND", previousCount: prevCount, currentCount: currCount, status: currCount < prevCount ? "IMPROVED" : "WORSENED" });
  }

  return {
    hasPreviousVisit: true,
    previousVisitDate: previous.admissionDate.toISOString(),
    currentVisitDate: current.admissionDate.toISOString(),
    changes,
  };
}
