import type { JobType } from "@dfp/shared";
import { prisma } from "../db.js";

// A durable, SQLite-backed job queue standing in for Redis + BullMQ (no Docker
// on this machine — see ARCHITECTURE.md / the master plan for the swap path).
// Jobs survive a process restart because they live in the same DB as everything
// else; a production swap to BullMQ only touches this file and worker.ts.

export async function enqueueJob(type: JobType, payload: unknown, runAt: Date = new Date()) {
  return prisma.job.create({
    data: {
      type,
      payload: JSON.stringify(payload),
      runAt,
    },
  });
}

export async function claimNextJobs(limit: number) {
  const now = new Date();
  const candidates = await prisma.job.findMany({
    where: { status: "PENDING", runAt: { lte: now } },
    orderBy: { runAt: "asc" },
    take: limit,
  });

  const claimed = [];
  for (const job of candidates) {
    // Optimistic claim: only succeeds if still PENDING, guards against a second
    // worker process racing us for the same row.
    const result = await prisma.job.updateMany({
      where: { id: job.id, status: "PENDING" },
      data: { status: "IN_PROGRESS", attempts: { increment: 1 } },
    });
    if (result.count === 1) claimed.push(job);
  }
  return claimed;
}

export async function markJobDone(jobId: string) {
  await prisma.job.update({ where: { id: jobId }, data: { status: "DONE" } });
}

const MAX_ATTEMPTS = 3;

export async function markJobFailed(jobId: string, error: string, attempts: number) {
  const willRetry = attempts < MAX_ATTEMPTS;
  await prisma.job.update({
    where: { id: jobId },
    data: {
      status: willRetry ? "PENDING" : "FAILED",
      lastError: error,
      // simple exponential backoff before the next retry
      runAt: willRetry ? new Date(Date.now() + attempts * 5000) : undefined,
    },
  });
}
