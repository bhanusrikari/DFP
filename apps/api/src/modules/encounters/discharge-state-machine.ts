import { FailureStage, FailureTag, ManagementStatus, MedicalStatus, OverallStatus } from "@dfp/shared";
import type { OverallStatus as OverallStatusType } from "@dfp/shared";

// The single place `Encounter.overallStatus` is computed. Every write to this
// state happens through one of the two functions below — nothing else in the
// codebase sets overallStatus directly. This is what makes
// "DISCHARGE_APPROVED requires MEDICAL_READY AND APPROVED" a structural
// guarantee rather than a convention two different modules have to agree on.

export class InvalidTransitionError extends Error {}

export function applyMedicalDecision(
  currentStatus: OverallStatusType,
  medicalStatus: (typeof MedicalStatus)[keyof typeof MedicalStatus]
): OverallStatusType {
  if (currentStatus === OverallStatus.DISCHARGE_APPROVED) {
    throw new InvalidTransitionError("Cannot change the medical decision after discharge has been approved.");
  }
  return medicalStatus === MedicalStatus.MEDICAL_READY
    ? OverallStatus.MANAGEMENT_REVIEW
    : OverallStatus.IN_PROGRESS;
}

export function applyManagementDecision(
  currentStatus: OverallStatusType,
  managementStatus: (typeof ManagementStatus)[keyof typeof ManagementStatus],
  failureTag?: (typeof FailureTag)[keyof typeof FailureTag] | null
): { overallStatus: OverallStatusType; failureStage: string | null; failureTag: string | null } {
  if (currentStatus !== OverallStatus.MANAGEMENT_REVIEW) {
    throw new InvalidTransitionError(
      "Management can only decide on an encounter that is medically ready (overallStatus=MANAGEMENT_REVIEW)."
    );
  }

  if (managementStatus === ManagementStatus.PENDING) {
    // Saving checklist progress without a final decision yet.
    return { overallStatus: OverallStatus.MANAGEMENT_REVIEW, failureStage: null, failureTag: null };
  }

  if (managementStatus === ManagementStatus.APPROVED) {
    return { overallStatus: OverallStatus.DISCHARGE_APPROVED, failureStage: null, failureTag: null };
  }

  if (!failureTag) {
    throw new InvalidTransitionError("A failure_tag is required when management_status is FAILED.");
  }
  return { overallStatus: OverallStatus.DISCHARGE_FAILED, failureStage: FailureStage.MANAGEMENT, failureTag };
}
