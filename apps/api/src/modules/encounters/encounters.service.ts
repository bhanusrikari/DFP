import type { AIFinding } from "@dfp/shared";
import { prisma } from "../../db.js";
import { scoreDischargeRisk } from "../risk-score/risk-score.service.js";
import { computeDischargeBlockers } from "./discharge-blockers.js";
import { computeHistoricalChanges } from "./historical-changes.js";
import { matchCaregivers } from "../caregiver-matching/caregiver-matching.service.js";

export async function listEncounters(queue?: "doctor" | "management") {
  const where =
    queue === "doctor"
      ? { overallStatus: "IN_PROGRESS" }
      : queue === "management"
        ? { overallStatus: "MANAGEMENT_REVIEW" }
        : {};

  return prisma.encounter.findMany({
    where,
    orderBy: { admissionDate: "asc" },
    include: { patient: true, reports: true, medicalDecision: true, managementReview: true },
  });
}

type ChecklistState = "SATISFIED" | "OUTSTANDING" | "IN_PROGRESS" | "NOT_REQUIRED";

function checklistState(required: boolean, hasReview: boolean, clearedCondition: boolean | null): ChecklistState {
  if (!required) return "NOT_REQUIRED";
  if (!hasReview) return "IN_PROGRESS"; // management hasn't looked yet
  if (clearedCondition === true) return "SATISFIED";
  if (clearedCondition === false) return "OUTSTANDING";
  return "IN_PROGRESS";
}

// Management worklist — deliberately excludes clinical fields (reports,
// AI analyses, doctor's notes): per NFR-2 (minimum necessary access),
// management sees the OUTCOME of medical review, never its clinical content.
export async function listManagementWorklist() {
  const encounters = await prisma.encounter.findMany({
    where: { overallStatus: { in: ["MANAGEMENT_REVIEW", "DISCHARGE_APPROVED", "DISCHARGE_FAILED"] } },
    orderBy: { admissionDate: "asc" },
    include: {
      patient: true,
      medicalDecision: true,
      managementReview: true,
      appointments: true,
      prescriptions: true,
      // Read internally to derive caregiver support categories (e.g. "Home
      // monitoring") — the raw findings/values themselves are never put on
      // the response object below.
      aiAnalyses: { where: { scope: "OVERALL" } },
    },
  });

  return encounters.map((e) => {
    const hasReview = !!e.managementReview;
    const blockers = computeDischargeBlockers({
      medicalDecision: e.medicalDecision,
      managementReview: e.managementReview,
      appointmentCount: e.appointments.length,
      overallStatus: e.overallStatus,
    });

    const ageYears = Math.floor((Date.now() - e.patient.dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
    const readySince = e.medicalDecision?.decidedAt ?? null;
    const ageingMs = readySince ? Date.now() - readySince.getTime() : 0;

    const overallFindings: AIFinding[] = e.aiAnalyses[0] ? JSON.parse(e.aiAnalyses[0].findingsJson) : [];
    const caregiverMatch = e.medicalDecision?.caregiverRequired
      ? matchCaregivers({ ageYears, ward: e.ward, prescriptions: e.prescriptions, overallFindings })
      : null;

    return {
      id: e.id,
      patient: { id: e.patient.id, name: e.patient.name, ageYears },
      ward: e.ward,
      overallStatus: e.overallStatus,
      dischargeDate: e.dischargeDate,
      readySince,
      ageingMs,
      caregiverRequired: e.medicalDecision?.caregiverRequired ?? false,
      checklist: {
        caregiver: checklistState(e.medicalDecision?.caregiverRequired ?? false, hasReview, e.managementReview?.caregiverAvailable ?? null),
        insurance: checklistState(true, hasReview, hasReview ? e.managementReview!.insuranceStatus === "CLEARED" : null),
        billing: checklistState(true, hasReview, hasReview ? e.managementReview!.billingStatus === "CLEARED" : null),
        documents: checklistState(true, hasReview, hasReview ? e.managementReview!.documentsStatus === "COMPLETE" : null),
      },
      dischargeBlockers: blockers,
      caregiverMatch,
    };
  });
}

export async function getEncounterDetail(encounterId: string) {
  const encounter = await prisma.encounter.findUnique({
    where: { id: encounterId },
    include: {
      patient: true,
      reports: { orderBy: { createdAt: "asc" } },
      aiAnalyses: true,
      medicalDecision: true,
      managementReview: true,
      prescriptions: true,
      appointments: true,
      carePlan: { include: { items: { include: { reminders: true } } } },
    },
  });
  if (!encounter) return null;

  const overallAnalysis = encounter.aiAnalyses.find((a) => a.scope === "OVERALL");
  const findings: AIFinding[] = overallAnalysis ? JSON.parse(overallAnalysis.findingsJson) : [];

  const ageYears = Math.floor(
    (Date.now() - encounter.patient.dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  );
  const lengthOfStayDays = Math.max(
    1,
    Math.floor((Date.now() - encounter.admissionDate.getTime()) / (1000 * 60 * 60 * 24))
  );
  const priorEncountersCount = await prisma.encounter.count({
    where: { patientId: encounter.patientId, id: { not: encounter.id } },
  });

  const risk = scoreDischargeRisk({
    ageYears,
    lengthOfStayDays,
    findings,
    caregiverRequired: encounter.medicalDecision?.caregiverRequired ?? false,
    priorEncountersCount,
  });

  // --- Feature: Discharge Blocker Intelligence ---
  const dischargeBlockers = computeDischargeBlockers({
    medicalDecision: encounter.medicalDecision,
    managementReview: encounter.managementReview,
    appointmentCount: encounter.appointments.length,
    overallStatus: encounter.overallStatus,
  });

  // --- Feature: Historical Change Detection ---
  const previousEncounter = await prisma.encounter.findFirst({
    where: { patientId: encounter.patientId, id: { not: encounter.id }, admissionDate: { lt: encounter.admissionDate } },
    orderBy: { admissionDate: "desc" },
    include: { reports: true, prescriptions: true, aiAnalyses: true },
  });
  const historicalChanges = computeHistoricalChanges(encounter, previousEncounter);

  // --- Feature: Caregiver Matching (only relevant once the doctor has flagged it) ---
  const caregiverMatch = encounter.medicalDecision?.caregiverRequired
    ? matchCaregivers({
        ageYears,
        ward: encounter.ward,
        prescriptions: encounter.prescriptions,
        overallFindings: findings,
      })
    : null;

  return { ...encounter, riskIndicator: risk, dischargeBlockers, historicalChanges, caregiverMatch };
}
