import type { AIFinding } from "@dfp/shared";
import { CAREGIVERS, type Caregiver } from "./caregivers.data.js";

// Feature: Caregiver Matching. Deterministic requirement-derivation + scoring
// — explainable ("why was this caregiver recommended"), not a model. Only
// runs when the doctor has flagged caregiverRequired=true.

export interface CaregiverRanked {
  caregiver: Caregiver;
  matchedSkills: string[];
  missingSkills: string[];
  available: boolean;
  score: number; // 0-1
}

export interface CaregiverMatchResult {
  requirements: string[];
  requiredDurationDays: number;
  ranked: CaregiverRanked[];
  recommended: Caregiver | null;
  reason: string;
}

function deriveRequirements(input: {
  ageYears: number;
  ward: string | null;
  prescriptionCount: number;
  longestPrescriptionDays: number;
  hasHighSeverityFinding: boolean;
}): { requirements: string[]; durationDays: number } {
  const requirements: string[] = [];
  const ward = (input.ward ?? "").toLowerCase();

  if (input.prescriptionCount > 0) requirements.push("Medication assistance");
  if (ward.includes("ortho") || ward.includes("icu") || input.ageYears >= 70) requirements.push("Mobility assistance");
  if (input.ageYears >= 65) requirements.push("Elderly care");
  if (ward.includes("ortho") || ward.includes("surg")) requirements.push("Post-surgery support");
  if (input.hasHighSeverityFinding) requirements.push("Home monitoring");
  if (requirements.length === 0) requirements.push("Medication assistance"); // caregiver was still requested — assume baseline support

  const durationDays = Math.max(3, input.longestPrescriptionDays || 7);
  return { requirements: [...new Set(requirements)], durationDays };
}

export function matchCaregivers(input: {
  ageYears: number;
  ward: string | null;
  prescriptions: { durationDays: number }[];
  overallFindings: AIFinding[];
}): CaregiverMatchResult {
  const { requirements, durationDays } = deriveRequirements({
    ageYears: input.ageYears,
    ward: input.ward,
    prescriptionCount: input.prescriptions.length,
    longestPrescriptionDays: Math.max(0, ...input.prescriptions.map((p) => p.durationDays)),
    hasHighSeverityFinding: input.overallFindings.some((f) => f.severity === "HIGH"),
  });

  const ranked: CaregiverRanked[] = CAREGIVERS.map((caregiver) => {
    const matchedSkills = requirements.filter((r) => caregiver.skills.includes(r));
    const missingSkills = requirements.filter((r) => !caregiver.skills.includes(r));
    const available = caregiver.currentAssignment === null && caregiver.availableDurationDays >= durationDays;
    const score = requirements.length ? matchedSkills.length / requirements.length : 1;
    return { caregiver, matchedSkills, missingSkills, available, score };
  }).sort((a, b) => Number(b.available) - Number(a.available) || b.score - a.score);

  const best = ranked.find((r) => r.available && r.score === 1) ?? ranked.find((r) => r.available && r.score > 0);

  if (!best) {
    const closest = ranked[0];
    const missing = closest?.missingSkills[0] ?? "the required support";
    return {
      requirements,
      requiredDurationDays: durationDays,
      ranked,
      recommended: null,
      reason: `No available caregiver matches the patient's ${missing.toLowerCase()} requirement.`,
    };
  }

  const reason =
    best.score === 1
      ? `${best.caregiver.name} matches all required skills (${requirements.join(", ")}) and is available for ${best.caregiver.availableDurationDays} days.`
      : `${best.caregiver.name} is the best available match (${best.matchedSkills.join(", ") || "partial match"}), though missing: ${best.missingSkills.join(", ")}.`;

  return { requirements, requiredDurationDays: durationDays, ranked, recommended: best.caregiver, reason };
}
