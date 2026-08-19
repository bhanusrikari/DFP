import type { FastifyReply, FastifyRequest } from "fastify";
import type { Role } from "@dfp/shared";

// Composes with the `authenticate` preHandler (JWT verification) registered
// in jwt.ts. This is the ONE place a role check happens for a route — the
// "only a human DOCTOR/MANAGEMENT actor can decide" rule (ARCHITECTURE.md
// section 2.3) lives here, not scattered across handlers.
export function requireRole(...allowed: Role[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const role = (request.user as { role?: string } | undefined)?.role;
    if (!role || !allowed.includes(role as Role)) {
      reply.code(403).send({ error: `Forbidden: requires role ${allowed.join(" or ")}` });
    }
  };
}
