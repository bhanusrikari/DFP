import type { AIFinding, Severity } from "@dfp/shared";
import { findReferenceRange } from "./reference-ranges.js";

export interface StructuredLabValue {
  test: string;
  value: number;
  unit: string;
}

// Deterministic reference-range check. Latency: <5ms, pure function, no
// network/model call. This deliberately stays a rule engine rather than a
// model — see the master plan's ML-usage table for why.
export function checkStructuredValues(values: StructuredLabValue[]): AIFinding[] {
  const findings: AIFinding[] = [];

  for (const v of values) {
    const range = findReferenceRange(v.test);
    if (!range) continue;

    if (v.value < range.low || v.value > range.high) {
      const direction = v.value < range.low ? "low" : "high";
      const distance = direction === "low" ? range.low - v.value : v.value - range.high;
      const span = range.high - range.low;
      const severity: Severity = distance > span * 0.5 ? "HIGH" : distance > span * 0.15 ? "MODERATE" : "LOW";

      findings.push({
        finding: `${v.test} is ${direction} (${v.value} ${v.unit})`,
        value: `${v.value} ${v.unit}`,
        referenceRange: `${range.low}-${range.high} ${range.unit}`,
        severity,
      });
    }
  }

  return findings;
}
