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

    if (item.itemType === "APPOINTMENT") {
      const advanceDate = new Date(item.scheduledAt.getTime() - 24 * 60 * 60 * 1000);
      if (advanceDate > carePlan.dischargeDate) {
        const advReminder = await prisma.reminderLog.create({
          data: {
            carePlanItemId: item.id,
            channel: "WHATSAPP",
            scheduledAt: advanceDate,
            status: "SCHEDULED",
          },
        });
        const advDelayMs = Math.max(0, advanceDate.getTime() - carePlan.dischargeDate.getTime());
        const advDemoDelayMs = Math.max(0, advDelayMs / env.demoTimeAcceleration);
        await enqueueJob("SEND_REMINDER", { reminderLogId: advReminder.id }, new Date(Date.now() + advDemoDelayMs));
      }
    }
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
    toEmail: patient.email,
    message: (() => {
      if (reminder.carePlanItem.itemType === "DISCHARGE_SUMMARY") {
        return `Hello ${patient.name}, your Discharge Summary and Care Plan is ready! Please review your schedule: ${reminder.carePlanItem.description}`;
      }
      if (reminder.carePlanItem.itemType === "APPOINTMENT") {
        return `Reminder for ${patient.name}: You have an upcoming ${reminder.carePlanItem.description} at ${reminder.carePlanItem.scheduledAt.toLocaleString()}`;
      }
      return `Reminder for ${patient.name}: ${reminder.carePlanItem.description} (scheduled ${reminder.scheduledAt.toLocaleString()})`;
    })(),
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
