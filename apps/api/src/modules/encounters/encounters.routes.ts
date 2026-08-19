import type { FastifyInstance } from "fastify";
import { getAuditTrailForEncounter } from "../audit/audit.service.js";
import { getEncounterDetail, listEncounters, listManagementWorklist } from "./encounters.service.js";

export async function encountersRoutes(app: FastifyInstance) {
  const auth = { preHandler: [(app as any).authenticate] };

  app.get("/api/encounters", auth, async (request) => {
    const { queue } = request.query as { queue?: "doctor" | "management" };
    return listEncounters(queue);
  });

  // NFR-2: a deliberately narrow, non-clinical projection for the
  // Management dashboard worklist — see listManagementWorklist().
  app.get("/api/management/worklist", auth, async () => listManagementWorklist());

  app.get("/api/encounters/:id", auth, async (request, reply) => {
    const { id } = request.params as { id: string };
    const encounter = await getEncounterDetail(id);
    if (!encounter) return reply.code(404).send({ error: "Encounter not found" });
    return encounter;
  });

  app.get("/api/encounters/:id/audit", auth, async (request) => {
    const { id } = request.params as { id: string };
    return getAuditTrailForEncounter(id);
  });
}
