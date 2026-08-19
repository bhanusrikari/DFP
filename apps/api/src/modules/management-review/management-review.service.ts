import type { FailureTag, ManagementStatus } from "@dfp/shared";
import { prisma } from "../../db.js";
import { recordAudit } from "../audit/audit.service.js";
import { applyManagementDecision, InvalidTransitionError } from "../encounters/discharge-state-machine.js";
import { enqueueJob } from "../../jobs/job-queue.js";

export { InvalidTransitionError };

export interface SubmitManagementReviewInput {
  encounterId: string;
  managementUserId: string;
  patientEmail?: string;
  caregiverAvailable?: boolean;
  insuranceStatus: string;
  billingStatus: string;
  documentsStatus: string;
  otherNotes?: string;
  managementStatus: ManagementStatus;
  failureTag?: FailureTag;
}

// The ONLY write path for ManagementReview. Requires an authenticated
// MANAGEMENT actor (enforced by requireRole in the route), and the state
// machine (discharge-state-machine.ts) refuses this unless the encounter is
// already MANAGEMENT_REVIEW — i.e. a doctor has already set MEDICAL_READY.
export async function submitManagementReview(input: SubmitManagementReviewInput) {
  const encounter = await prisma.encounter.findUniqueOrThrow({ where: { id: input.encounterId } });
  const transition = applyManagementDecision(encounter.overallStatus as any, input.managementStatus, input.failureTag);

  const review = await prisma.$transaction(async (tx) => {
    if (input.patientEmail) {
      await tx.patient.update({
        where: { id: encounter.patientId },
        data: { email: input.patientEmail },
      });
    }

    const review = await tx.managementReview.upsert({
      where: { encounterId: input.encounterId },
      create: {
        encounterId: input.encounterId,
        managementUserId: input.managementUserId,
        caregiverAvailable: input.caregiverAvailable,
        insuranceStatus: input.insuranceStatus,
        billingStatus: input.billingStatus,
        documentsStatus: input.documentsStatus,
        otherNotes: input.otherNotes,
        managementStatus: input.managementStatus,
        failureTag: transition.failureTag,
      },
      update: {
        managementUserId: input.managementUserId,
        caregiverAvailable: input.caregiverAvailable,
        insuranceStatus: input.insuranceStatus,
        billingStatus: input.billingStatus,
        documentsStatus: input.documentsStatus,
        otherNotes: input.otherNotes,
        managementStatus: input.managementStatus,
        failureTag: transition.failureTag,
        reviewedAt: new Date(),
      },
    });

    await tx.encounter.update({
      where: { id: input.encounterId },
      data: {
        overallStatus: transition.overallStatus,
        failureStage: transition.failureStage,
        failureTag: transition.failureTag,
        dischargeDate: transition.overallStatus === "DISCHARGE_APPROVED" ? new Date() : undefined,
      },
    });

    return review;
  });

  await recordAudit({
    entityType: "Encounter",
    entityId: input.encounterId,
    action: "MANAGEMENT_REVIEW_SUBMITTED",
    actorUserId: input.managementUserId,
    actorRole: "MANAGEMENT",
    before: { overallStatus: encounter.overallStatus },
    after: { overallStatus: transition.overallStatus, managementStatus: input.managementStatus, failureTag: transition.failureTag },
  });

  if (transition.overallStatus === "DISCHARGE_APPROVED") {
    await enqueueJob("GENERATE_CARE_PLAN", { encounterId: input.encounterId });
  }

  return review;
}
