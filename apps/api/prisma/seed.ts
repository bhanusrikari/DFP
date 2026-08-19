import { PrismaClient } from "@prisma/client";
import { clearAllData, seedDemoData } from "../src/modules/dev/seed-data.js";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding demo data...");
  await clearAllData(prisma);
  const counts = await seedDemoData(prisma);
  console.log(`Seeded ${counts.patients} patients (${counts.doctorQueue} in doctor queue, ${counts.managementQueue} in management queue).`);
  console.log("Demo logins: doctor@demo.com / management@demo.com, password: password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
