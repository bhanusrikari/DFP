import { prisma } from "../../db.js";

interface RecordAuditInput {
  entityType: string;
  entityId: string;
  action: string;
  actorUserId?: string | null;
  actorRole?: string | null;
  before?: unknown;
  after?: unknown;
}

// Single write path for AuditLog. Every module that mutates state calls this
// instead of writing to the AuditLog table directly, so "every decision is
// traceable" (PRD section 7) is true by construction, not by convention.
export async function recordAudit(input: RecordAuditInput): Promise<void> {
  await prisma.auditLog.create({
    data: {
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      actorUserId: input.actorUserId ?? null,
      actorRole: input.actorRole ?? null,
      beforeState: input.before !== undefined ? JSON.stringify(input.before) : null,
      afterState: input.after !== undefined ? JSON.stringify(input.after) : null,
    },
  });
}

export async function getAuditTrailForEncounter(encounterId: string) {
  return prisma.auditLog.findMany({
    where: { entityId: encounterId },
    orderBy: { timestamp: "asc" },
  });
}
