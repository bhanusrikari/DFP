import { prisma } from "./db.js";
import { enqueueJob } from "./jobs/job-queue.js";

async function main() {
  const encs = await prisma.encounter.findMany({
    where: { overallStatus: "DISCHARGE_APPROVED" }
  });
  
  for (const enc of encs) {
    console.log("Triggering GENERATE_CARE_PLAN for", enc.id);
    await enqueueJob("GENERATE_CARE_PLAN", { encounterId: enc.id });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
