import { prisma } from "../../db.js";
import { env } from "../../config/env.js";
import { enqueueJob } from "../../jobs/job-queue.js";
import { getNotificationProvider } from "./providers/index.js";

// Creates one ReminderLog per CarePlanItem and enqueues its dispatch job.
// ReminderLog.scheduledAt keeps the REAL clinical timestamp (what the UI
// shows, matching the PRD's dated example). The job's runAt is compressed by
// DEMO_TIME_ACCELERATION so a demo doesn't require waiting real days for a
// reminder to fire — see .env.example.
export async function scheduleRemindersForCarePlan(carePlanId: string): Promise<void> {
  const items = await prisma.carePlanItem.findMany({ where: { carePlanId } });
  const carePlan = await prisma.carePlan.findUniqueOrThrow({ where: { id: carePlanId } });

  for (const item of items) {
    const reminder = await prisma.reminderLog.create({
      data: {
        carePlanItemId: item.id,
        channel: "WHATSAPP",
        scheduledAt: item.scheduledAt,
        status: "SCHEDULED",
      },
    });

    const realDelayMs = item.scheduledAt.getTime() - carePlan.dischargeDate.getTime();
    const demoDelayMs = Math.max(0, realDelayMs / env.demoTimeAcceleration);
    const runAt = new Date(Date.now() + demoDelayMs);

    await enqueueJob("SEND_REMINDER", { reminderLogId: reminder.id }, runAt);
  }
}

// Job handler: actually sends the reminder (or logs it, in mock mode) and
// records delivery status. Latency/cost here scale independently of the API
// request path — this always runs off a job, never inline with a user request.
export async function dispatchReminder(reminderLogId: string): Promise<void> {
  const reminder = await prisma.reminderLog.findUniqueOrThrow({
    where: { id: reminderLogId },
    include: { carePlanItem: { include: { carePlan: { include: { encounter: { include: { patient: true } } } } } } },
  });

  const patient = reminder.carePlanItem.carePlan.encounter.patient;
  const provider = getNotificationProvider();
  const result = await provider.send({
    toPhone: patient.contactPhone,
    message: `Reminder for ${patient.name}: ${reminder.carePlanItem.description} (scheduled ${reminder.scheduledAt.toLocaleString()})`,
  });

  await prisma.reminderLog.update({
    where: { id: reminderLogId },
    data: {
      status: result.success ? "SENT" : "FAILED",
      sentAt: result.success ? new Date() : undefined,
      providerMessageId: result.providerMessageId,
    },
  });
}
