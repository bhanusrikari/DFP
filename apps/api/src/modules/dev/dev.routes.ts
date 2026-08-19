import type { FastifyInstance } from "fastify";
import { prisma } from "../../db.js";
import { clearAllData, seedDemoData } from "./seed-data.js";

// Demo-reset button: wipes everything and rebuilds the fixed demo shape
// (3 patients in the doctor queue, 2 in management). Any authenticated user
// can trigger it — this is a demo utility, not a production admin action.
export async function devRoutes(app: FastifyInstance) {
  app.post("/api/dev/reseed", { preHandler: [(app as any).authenticate] }, async () => {
    await clearAllData(prisma);
    const counts = await seedDemoData(prisma);
    return { ok: true, ...counts };
  });
}
