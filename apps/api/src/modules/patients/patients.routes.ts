import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { Role } from "@dfp/shared";
import { requireRole } from "../../auth/rbac.middleware.js";
import { createEncounter, createPatient, getPatientHistory, listPatients } from "./patients.service.js";

const createPatientSchema = z.object({
  name: z.string().min(1),
  dob: z.string(),
  gender: z.string().min(1),
  contactPhone: z.string().optional(),
  mrn: z.string().optional(),
});

const createEncounterSchema = z.object({
  ward: z.string().optional(),
});

export async function patientsRoutes(app: FastifyInstance) {
  const auth = { preHandler: [(app as any).authenticate] };

  app.get("/api/patients", auth, async () => listPatients());

  app.get("/api/patients/:id/history", auth, async (request, reply) => {
    const { id } = request.params as { id: string };
    const patient = await getPatientHistory(id);
    if (!patient) return reply.code(404).send({ error: "Patient not found" });
    return patient;
  });

  app.post(
    "/api/patients",
    { preHandler: [(app as any).authenticate, requireRole(Role.DOCTOR, Role.ADMIN)] },
    async (request, reply) => {
      const parsed = createPatientSchema.safeParse(request.body);
      if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
      return createPatient(parsed.data);
    }
  );

  app.post(
    "/api/patients/:id/encounters",
    { preHandler: [(app as any).authenticate, requireRole(Role.DOCTOR, Role.ADMIN)] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parsed = createEncounterSchema.safeParse(request.body ?? {});
      if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
      const user = request.user as { sub: string };
      return createEncounter(id, { ward: parsed.data.ward, admittingDoctorId: user.sub });
    }
  );
}
