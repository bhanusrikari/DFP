import { prisma } from "../../../../../c:/Dev/DFP/apps/api/src/db.js";
import { enqueueJob } from "../../../../../c:/Dev/DFP/apps/api/src/jobs/job-queue.js";

async function main() {
  const enc = await prisma.encounter.findFirst({
    where: { overallStatus: "MANAGEMENT_REVIEW" },
    include: { patient: true }
  });
  if (!enc) {
    console.log("No encounter found");
    return;
  }
  
  await prisma.encounter.update({
    where: { id: enc.id },
    data: { overallStatus: "DISCHARGE_APPROVED" }
  });

  await enqueueJob("GENERATE_CARE_PLAN", { encounterId: enc.id });
  console.log(`Approved encounter for ${enc.patient.name} and triggered CARE_PLAN generation`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
