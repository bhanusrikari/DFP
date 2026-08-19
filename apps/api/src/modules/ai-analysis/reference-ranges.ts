// A small clinical reference-range table used by the deterministic rule engine
// (abnormal-rules.engine.ts). This is intentionally NOT part of the LLM call —
// see the master plan's "Where ML models are used" table: a value being
// outside a published range is a fact, not a language-model judgment call.

export interface ReferenceRange {
  test: string;
  unit: string;
  low: number;
  high: number;
}

export const REFERENCE_RANGES: ReferenceRange[] = [
  { test: "Hemoglobin", unit: "g/dL", low: 12.0, high: 17.5 },
  { test: "WBC", unit: "10^3/uL", low: 4.0, high: 11.0 },
  { test: "Platelets", unit: "10^3/uL", low: 150, high: 450 },
  { test: "Glucose", unit: "mg/dL", low: 70, high: 140 },
  { test: "Creatinine", unit: "mg/dL", low: 0.6, high: 1.3 },
  { test: "Sodium", unit: "mmol/L", low: 135, high: 145 },
  { test: "Potassium", unit: "mmol/L", low: 3.5, high: 5.1 },
  { test: "SystolicBP", unit: "mmHg", low: 90, high: 130 },
  { test: "DiastolicBP", unit: "mmHg", low: 60, high: 85 },
  { test: "HeartRate", unit: "bpm", low: 60, high: 100 },
  { test: "SpO2", unit: "%", low: 94, high: 100 },
  { test: "Temperature", unit: "F", low: 97.0, high: 99.5 },
];

export function findReferenceRange(test: string): ReferenceRange | undefined {
  return REFERENCE_RANGES.find((r) => r.test.toLowerCase() === test.toLowerCase());
}
