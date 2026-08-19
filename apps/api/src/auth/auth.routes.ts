import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { verifyCredentials } from "./auth.service.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function authRoutes(app: FastifyInstance) {
  app.post("/api/auth/login", async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid credentials payload" });
    }

    const user = await verifyCredentials(parsed.data.email, parsed.data.password);
    if (!user) {
      return reply.code(401).send({ error: "Invalid email or password" });
    }

    const token = await reply.jwtSign(
      { sub: user.id, role: user.role, name: user.name },
      { expiresIn: "12h" }
    );

    return { token, user: { id: user.id, name: user.name, role: user.role, email: user.email } };
  });

  app.get("/api/auth/me", { preHandler: [(app as any).authenticate] }, async (request) => {
    return { user: request.user };
  });
}
