import { prisma } from "../../db.js";
import { recordAudit } from "../audit/audit.service.js";
import { scheduleRemindersForCarePlan } from "../reminders/reminder-scheduler.js";

const DOSES_PER_DAY: Record<string, number> = {
  "once daily": 1,
  "once a day": 1,
  "twice daily": 2,
  "twice a day": 2,
  "every 12 hours": 2,
  "three times daily": 3,
  "three times a day": 3,
  "every 8 hours": 3,
  "four times daily": 4,
  "every 6 hours": 4,
};

function dosesPerDayFor(frequency: string): number {
  return DOSES_PER_DAY[frequency.trim().toLowerCase()] ?? 1;
}

// Expands a doctor's prescriptions + appointments into a dated CarePlan with
// one CarePlanItem per medicine dose / appointment / instruction — the
// PRD's "19 Aug Discharge / 20 Aug 8:00 medicine / 25 Aug follow-up / 26 Aug
// course completed" example, generalized. Triggered by the GENERATE_CARE_PLAN
// job, which only ever fires after the state machine reaches DISCHARGE_APPROVED.
export async function generateCarePlan(encounterId: string): Promise<void> {
  const encounter = await prisma.encounter.findUniqueOrThrow({
    where: { id: encounterId },
    include: { prescriptions: true, appointments: true },
  });

  const dischargeDate = encounter.dischargeDate ?? new Date();

  const carePlan = await prisma.carePlan.upsert({
    where: { encounterId },
    create: { encounterId, dischargeDate, status: "ACTIVE" },
    update: { dischargeDate, status: "ACTIVE" },
  });

  // Regenerating (e.g. re-run) starts from a clean item list.
  await prisma.carePlanItem.deleteMany({ where: { carePlanId: carePlan.id } });

  const items: { itemType: string; sourceRef: string; scheduledAt: Date; description: string }[] = [];

  items.push({
    itemType: "INSTRUCTION",
    sourceRef: "discharge",
    scheduledAt: dischargeDate,
    description: "Discharge",
  });

  let latestCourseEnd: Date | null = null;

  for (const rx of encounter.prescriptions) {
    const dosesPerDay = dosesPerDayFor(rx.frequency);
    const startOfDay = new Date(rx.startDate);
    startOfDay.setHours(8, 0, 0, 0); // first dose at 8:00 AM, evenly spaced through the day

    for (let day = 0; day < rx.durationDays; day++) {
      for (let dose = 0; dose < dosesPerDay; dose++) {
        const hourOffset = Math.floor((12 / dosesPerDay) * dose); // spread doses across a 12h waking window
        const scheduledAt = new Date(startOfDay);
        scheduledAt.setDate(scheduledAt.getDate() + day);
        scheduledAt.setHours(8 + hourOffset, 0, 0, 0);

        items.push({
          itemType: "MEDICINE_DOSE",
          sourceRef: rx.id,
          scheduledAt,
          description: `${rx.medicineName} ${rx.dosage}${rx.instructions ? ` — ${rx.instructions}` : ""}`,
        });
      }
    }

    const courseEnd = new Date(startOfDay);
    courseEnd.setDate(courseEnd.getDate() + rx.durationDays);
    if (!latestCourseEnd || courseEnd > latestCourseEnd) latestCourseEnd = courseEnd;
  }

  if (latestCourseEnd) {
    items.push({
      itemType: "INSTRUCTION",
      sourceRef: "course-complete",
      scheduledAt: latestCourseEnd,
      description: "Medicine course completed",
    });
  }

  for (const appt of encounter.appointments) {
    items.push({
      itemType: "APPOINTMENT",
      sourceRef: appt.id,
      scheduledAt: appt.scheduledDate,
      description: `Follow-up appointment: ${appt.type}${appt.provider ? ` with ${appt.provider}` : ""}`,
    });
  }

  items.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());

  await prisma.carePlanItem.createMany({
    data: items.map((i) => ({ ...i, carePlanId: carePlan.id })),
  });

  await recordAudit({
    entityType: "Encounter",
    entityId: encounterId,
    action: "CARE_PLAN_GENERATED",
    after: { itemCount: items.length },
  });

  await scheduleRemindersForCarePlan(carePlan.id);
}
