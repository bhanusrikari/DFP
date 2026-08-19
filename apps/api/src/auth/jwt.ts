import fastifyJwt from "@fastify/jwt";
import type { FastifyInstance } from "fastify";
import { env } from "../config/env.js";

export interface JwtPayload {
  sub: string; // user id
  role: string; // Role
  name: string;
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}

export function registerJwt(app: FastifyInstance): void {
  app.register(fastifyJwt, { secret: env.jwtSecret });

  app.decorate("authenticate", async (request: any, reply: any) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ error: "Unauthorized" });
    }
  });
}
