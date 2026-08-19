import type { MedicalStatus } from "@dfp/shared";
import { prisma } from "../../db.js";
import { recordAudit } from "../audit/audit.service.js";
import { applyMedicalDecision, InvalidTransitionError } from "../encounters/discharge-state-machine.js";

export { InvalidTransitionError };

export interface SubmitMedicalDecisionInput {
  encounterId: string;
  doctorId: string;
  medicalStatus: MedicalStatus;
  caregiverRequired: boolean;
  doctorNotes?: string;
  prescriptions: { medicineName: string; dosage: string; frequency: string; route?: string; durationDays: number; startDate: string; instructions?: string }[];
  appointments: { type: string; scheduledDate: string; provider?: string; instructions?: string }[];
}

// The ONLY write path for DischargeDecisionMedical. Requires an authenticated
// DOCTOR actor (enforced by requireRole in the route) — AIAnalysis is never
// read or written here, it is purely informational context the doctor saw
// on the dashboard before calling this endpoint.
export async function submitMedicalDecision(input: SubmitMedicalDecisionInput) {
  const encounter = await prisma.encounter.findUniqueOrThrow({ where: { id: input.encounterId } });
  const newOverallStatus = applyMedicalDecision(encounter.overallStatus as any, input.medicalStatus);

  const result = await prisma.$transaction(async (tx) => {
    const decision = await tx.dischargeDecisionMedical.upsert({
      where: { encounterId: input.encounterId },
      create: {
        encounterId: input.encounterId,
        doctorId: input.doctorId,
        medicalStatus: input.medicalStatus,
        caregiverRequired: input.caregiverRequired,
        doctorNotes: input.doctorNotes,
      },
      update: {
        doctorId: input.doctorId,
        medicalStatus: input.medicalStatus,
        caregiverRequired: input.caregiverRequired,
        doctorNotes: input.doctorNotes,
        decidedAt: new Date(),
      },
    });

    await tx.prescription.deleteMany({ where: { encounterId: input.encounterId } });
    if (input.prescriptions.length) {
      await tx.prescription.createMany({
        data: input.prescriptions.map((p) => ({
          encounterId: input.encounterId,
          medicineName: p.medicineName,
          dosage: p.dosage,
          frequency: p.frequency,
          route: p.route,
          durationDays: p.durationDays,
          startDate: new Date(p.startDate),
          instructions: p.instructions,
        })),
      });
    }

    await tx.appointment.deleteMany({ where: { encounterId: input.encounterId } });
    if (input.appointments.length) {
      await tx.appointment.createMany({
        data: input.appointments.map((a) => ({
          encounterId: input.encounterId,
          type: a.type,
          scheduledDate: new Date(a.scheduledDate),
          provider: a.provider,
          instructions: a.instructions,
        })),
      });
    }

    await tx.encounter.update({ where: { id: input.encounterId }, data: { overallStatus: newOverallStatus } });

    return decision;
  });

  await recordAudit({
    entityType: "Encounter",
    entityId: input.encounterId,
    action: "MEDICAL_DECISION_SUBMITTED",
    actorUserId: input.doctorId,
    actorRole: "DOCTOR",
    before: { overallStatus: encounter.overallStatus },
    after: { overallStatus: newOverallStatus, medicalStatus: input.medicalStatus },
  });

  return result;
}
