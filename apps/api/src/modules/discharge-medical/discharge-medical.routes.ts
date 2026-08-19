import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { MedicalStatus, Role } from "@dfp/shared";
import { requireRole } from "../../auth/rbac.middleware.js";
import { InvalidTransitionError, submitMedicalDecision } from "./discharge-medical.service.js";

const prescriptionSchema = z.object({
  medicineName: z.string().min(1),
  dosage: z.string().min(1),
  frequency: z.string().min(1),
  route: z.string().optional(),
  durationDays: z.number().int().positive(),
  startDate: z.string(),
  instructions: z.string().optional(),
});

const appointmentSchema = z.object({
  type: z.string().min(1),
  scheduledDate: z.string(),
  provider: z.string().optional(),
  instructions: z.string().optional(),
});

const submitSchema = z.object({
  medicalStatus: z.enum([MedicalStatus.MEDICAL_READY, MedicalStatus.MEDICAL_NOT_READY]),
  caregiverRequired: z.boolean(),
  doctorNotes: z.string().optional(),
  prescriptions: z.array(prescriptionSchema).default([]),
  appointments: z.array(appointmentSchema).default([]),
});

export async function dischargeMedicalRoutes(app: FastifyInstance) {
  app.post(
    "/api/encounters/:id/medical-decision",
    { preHandler: [(app as any).authenticate, requireRole(Role.DOCTOR)] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parsed = submitSchema.safeParse(request.body);
      if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

      const user = request.user as { sub: string };
      try {
        const decision = await submitMedicalDecision({
          encounterId: id,
          doctorId: user.sub,
          ...parsed.data,
        });
        return decision;
      } catch (err) {
        if (err instanceof InvalidTransitionError) {
          return reply.code(409).send({ error: err.message });
        }
        throw err;
      }
    }
  );
}
