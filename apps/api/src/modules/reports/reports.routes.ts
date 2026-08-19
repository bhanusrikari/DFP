import type { FastifyInstance } from "fastify";
import { createReport, listReportsForEncounter } from "./reports.service.js";
import type { StructuredLabValue } from "../ai-analysis/abnormal-rules.engine.js";

export async function reportsRoutes(app: FastifyInstance) {
  const auth = { preHandler: [(app as any).authenticate] };

  app.get("/api/encounters/:id/reports", auth, async (request) => {
    const { id } = request.params as { id: string };
    return listReportsForEncounter(id);
  });

  // multipart/form-data: fields (encounterId, type, textContent, structuredValues JSON)
  // + an optional single file part named "file".
  app.post("/api/reports", auth, async (request, reply) => {
    const fields: Record<string, string> = {};
    let fileBuffer: Buffer | undefined;
    let originalFilename = "note.txt";

    for await (const part of request.parts()) {
      if (part.type === "file") {
        fileBuffer = await part.toBuffer();
        originalFilename = part.filename;
      } else {
        fields[part.fieldname] = String(part.value);
      }
    }

    if (!fields.encounterId || !fields.type) {
      return reply.code(400).send({ error: "encounterId and type are required fields" });
    }

    let structuredValues: StructuredLabValue[] | undefined;
    if (fields.structuredValues) {
      try {
        structuredValues = JSON.parse(fields.structuredValues);
      } catch {
        return reply.code(400).send({ error: "structuredValues must be valid JSON" });
      }
    }

    const user = request.user as { sub: string };
    const report = await createReport({
      encounterId: fields.encounterId,
      type: fields.type,
      originalFilename: fileBuffer ? originalFilename : fields.textContent ? `${fields.type}.txt` : "note.txt",
      fileBuffer,
      textContent: fields.textContent,
      structuredValues,
      uploadedById: user.sub,
    });

    return reply.code(201).send(report);
  });
}
