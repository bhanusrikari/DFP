import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { FailureTag, ManagementStatus, Role } from "@dfp/shared";
import { requireRole } from "../../auth/rbac.middleware.js";
import { InvalidTransitionError, submitManagementReview } from "./management-review.service.js";

const submitSchema = z.object({
  caregiverAvailable: z.boolean().optional(),
  insuranceStatus: z.string().min(1),
  billingStatus: z.string().min(1),
  documentsStatus: z.string().min(1),
  otherNotes: z.string().optional(),
  managementStatus: z.enum([ManagementStatus.PENDING, ManagementStatus.APPROVED, ManagementStatus.FAILED]),
  failureTag: z
    .enum([
      FailureTag.CAREGIVER_UNAVAILABLE,
      FailureTag.INSURANCE_PENDING,
      FailureTag.BILLING_PENDING,
      FailureTag.DOCUMENTS_INCOMPLETE,
      FailureTag.APPOINTMENT_NOT_SCHEDULED,
      FailureTag.OTHER_ADMINISTRATIVE_ISSUE,
    ])
    .optional(),
});

export async function managementReviewRoutes(app: FastifyInstance) {
  app.post(
    "/api/encounters/:id/management-review",
    { preHandler: [(app as any).authenticate, requireRole(Role.MANAGEMENT)] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parsed = submitSchema.safeParse(request.body);
      if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

      const user = request.user as { sub: string };
      try {
        return await submitManagementReview({
          encounterId: id,
          managementUserId: user.sub,
          ...parsed.data,
        });
      } catch (err) {
        if (err instanceof InvalidTransitionError) {
          return reply.code(409).send({ error: err.message });
        }
        throw err;
      }
    }
  );
}
