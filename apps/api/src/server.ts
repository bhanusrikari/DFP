import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { env } from "./config/env.js";
import { registerJwt } from "./auth/jwt.js";
import { authRoutes } from "./auth/auth.routes.js";
import { patientsRoutes } from "./modules/patients/patients.routes.js";
import { encountersRoutes } from "./modules/encounters/encounters.routes.js";
import { reportsRoutes } from "./modules/reports/reports.routes.js";
import { dischargeMedicalRoutes } from "./modules/discharge-medical/discharge-medical.routes.js";
import { managementReviewRoutes } from "./modules/management-review/management-review.routes.js";
import { devRoutes } from "./modules/dev/dev.routes.js";

const app = Fastify({ logger: true });

await app.register(cors, { origin: env.webOrigin, credentials: true });
await app.register(multipart, { limits: { fileSize: 20 * 1024 * 1024 } });
registerJwt(app);

app.get("/api/health", async () => ({ ok: true }));

await app.register(authRoutes);
await app.register(patientsRoutes);
await app.register(encountersRoutes);
await app.register(reportsRoutes);
await app.register(dischargeMedicalRoutes);
await app.register(managementReviewRoutes);
await app.register(devRoutes);

app
  .listen({ port: env.port, host: "0.0.0.0" })
  .then(() => console.log(`[api] listening on http://localhost:${env.port}`))
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
