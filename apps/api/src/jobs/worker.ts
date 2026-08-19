import "dotenv/config";
import { claimNextJobs, markJobDone, markJobFailed } from "./job-queue.js";
import { analyzeReport } from "../modules/ai-analysis/ai-analysis.service.js";
import { generateCarePlan } from "../modules/care-plan/care-plan.generator.js";
import { dispatchReminder } from "../modules/reminders/reminder-scheduler.js";

type JobHandler = (payload: any) => Promise<void>;

// Every JobType from @dfp/shared must have a handler here — this file is the
// only place job payloads get interpreted.
const handlers: Record<string, JobHandler> = {
  ANALYZE_REPORT: (payload) => analyzeReport(payload.reportId),
  GENERATE_CARE_PLAN: (payload) => generateCarePlan(payload.encounterId),
  SEND_REMINDER: (payload) => dispatchReminder(payload.reminderLogId),
};

const POLL_INTERVAL_MS = 1000;
const CONCURRENCY = 4;

async function tick() {
  const jobs = await claimNextJobs(CONCURRENCY);
  await Promise.all(
    jobs.map(async (job) => {
      const handler = handlers[job.type];
      if (!handler) {
        await markJobFailed(job.id, `No handler registered for job type ${job.type}`, job.attempts);
        return;
      }
      try {
        await handler(JSON.parse(job.payload));
        await markJobDone(job.id);
        console.log(`[worker] done: ${job.type} (${job.id})`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[worker] failed: ${job.type} (${job.id}) — ${message}`);
        await markJobFailed(job.id, message, job.attempts);
      }
    })
  );
}

async function main() {
  console.log("[worker] started, polling every", POLL_INTERVAL_MS, "ms");
  // eslint-disable-next-line no-constant-condition
  while (true) {
    await tick();
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

main();
