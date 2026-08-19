import type { JobType } from "@dfp/shared";
import { prisma } from "../../db.js";
import { recordAudit } from "../audit/audit.service.js";
import { enqueueJob } from "../../jobs/job-queue.js";
import { storageProvider } from "./storage.provider.js";
import type { StructuredLabValue } from "../ai-analysis/abnormal-rules.engine.js";

export interface CreateReportInput {
  encounterId: string;
  type: string;
  originalFilename: string;
  fileBuffer?: Buffer;
  textContent?: string;
  structuredValues?: StructuredLabValue[];
  uploadedById: string;
}

export async function createReport(input: CreateReportInput) {
  const fileObjectKey = input.fileBuffer
    ? await storageProvider.save(input.originalFilename, input.fileBuffer)
    : "none";

  const report = await prisma.report.create({
    data: {
      encounterId: input.encounterId,
      type: input.type,
      fileObjectKey,
      originalFilename: input.originalFilename,
      textContent: input.textContent,
      structuredValuesJson: input.structuredValues ? JSON.stringify(input.structuredValues) : null,
      uploadedById: input.uploadedById,
      status: "UPLOADED",
    },
  });

  await recordAudit({
    entityType: "Report",
    entityId: report.id,
    action: "UPLOADED",
    actorUserId: input.uploadedById,
    after: { type: report.type, originalFilename: report.originalFilename },
  });

  const jobType: JobType = "ANALYZE_REPORT";
  await enqueueJob(jobType, { reportId: report.id });

  return report;
}

export async function listReportsForEncounter(encounterId: string) {
  return prisma.report.findMany({ where: { encounterId }, orderBy: { createdAt: "asc" } });
}
