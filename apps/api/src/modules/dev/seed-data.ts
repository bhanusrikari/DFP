import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// Single source of truth for demo data — used by both `prisma/seed.ts` (CLI)
// and the POST /api/dev/reseed button, so both always produce the exact same
// shape: 3 patients in the doctor queue, 2 in the management queue, plus a
// couple of already-resolved patients so the other features (care plan,
// blockers, history comparison) stay demoable too.

const FK_SAFE_DELETE_ORDER = [
  "reminderLog",
  "carePlanItem",
  "carePlan",
  "auditLog",
  "job",
  "aIAnalysis",
  "prescription",
  "appointment",
  "managementReview",
  "dischargeDecisionMedical",
  "report",
  "encounter",
  "patient",
  "user",
] as const;

export async function clearAllData(prisma: PrismaClient): Promise<void> {
  for (const model of FK_SAFE_DELETE_ORDER) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any)[model].deleteMany();
  }
}

export interface SeedCounts {
  users: number;
  patients: number;
  doctorQueue: number;
  managementQueue: number;
}

export async function seedDemoData(prisma: PrismaClient): Promise<SeedCounts> {
  const passwordHash = await bcrypt.hash("password123", 10);

  const doctor = await prisma.user.create({
    data: { name: "Dr. Asha Rao", email: "doctor@demo.com", role: "DOCTOR", passwordHash },
  });
  const management = await prisma.user.create({
    data: { name: "Vikram Shah", email: "management@demo.com", role: "MANAGEMENT", passwordHash },
  });

  const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
  const daysFromNow = (n: number) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

  // ---------- Doctor queue: exactly 3 patients awaiting a medical decision ----------

  // 1. Sunita Verma — abnormal blood + clinical note, freshly uploaded so the
  //    worker analyzes them live (demonstrates the async AI pipeline).
  const sunita = await prisma.patient.create({
    data: { name: "Sunita Verma", dob: new Date("1990-07-22"), gender: "Female", contactPhone: "+15550002222" },
  });
  const sunitaEnc = await prisma.encounter.create({
    data: { patientId: sunita.id, admissionDate: daysAgo(2), ward: "Cardiology", admittingDoctorId: doctor.id },
  });
  const sunitaR1 = await prisma.report.create({
    data: {
      encounterId: sunitaEnc.id, type: "BLOOD", fileObjectKey: "none", originalFilename: "blood-panel.txt",
      structuredValuesJson: JSON.stringify([
        { test: "Hemoglobin", value: 9.8, unit: "g/dL" },
        { test: "WBC", value: 13.4, unit: "10^3/uL" },
        { test: "Potassium", value: 5.6, unit: "mmol/L" },
      ]),
      status: "UPLOADED", uploadedById: doctor.id,
    },
  });
  const sunitaR2 = await prisma.report.create({
    data: {
      encounterId: sunitaEnc.id, type: "CLINICAL_NOTE", fileObjectKey: "none", originalFilename: "clinical-note.txt",
      textContent: "Patient reports mild chest pain and occasional shortness of breath since admission.",
      status: "UPLOADED", uploadedById: doctor.id,
    },
  });

  // 2. Neha Kulkarni — has a PREVIOUS resolved visit too, so Historical
  //    Change Detection has something real to compare against.
  const neha = await prisma.patient.create({
    data: { name: "Neha Kulkarni", dob: new Date("1988-04-14"), gender: "Female", contactPhone: "+15550006666" },
  });
  const nehaPrevEnc = await prisma.encounter.create({
    data: {
      patientId: neha.id, admissionDate: daysAgo(20), dischargeDate: daysAgo(17), ward: "General Medicine",
      admittingDoctorId: doctor.id, overallStatus: "DISCHARGE_APPROVED",
    },
  });
  const nehaPrevReport = await prisma.report.create({
    data: {
      encounterId: nehaPrevEnc.id, type: "BLOOD", fileObjectKey: "none", originalFilename: "blood-panel.txt",
      structuredValuesJson: JSON.stringify([{ test: "WBC", value: 9.8, unit: "10^3/uL" }, { test: "Hemoglobin", value: 12.8, unit: "g/dL" }]),
      status: "ANALYZED", uploadedById: doctor.id,
    },
  });
  await prisma.aIAnalysis.create({
    data: {
      reportId: nehaPrevReport.id, encounterId: nehaPrevEnc.id, scope: "PER_REPORT",
      summaryText: "Blood panel reviewed — all captured values are within normal reference ranges.",
      findingsJson: "[]", plainLanguageExplanation: "In simple terms: nothing stands out as abnormal.",
      modelUsed: "mock-analyzer", promptVersion: "seed-v2",
    },
  });
  await prisma.aIAnalysis.create({
    data: {
      encounterId: nehaPrevEnc.id, scope: "OVERALL",
      summaryText: "Overall review across 1 report(s) for Neha Kulkarni: no abnormal findings identified.",
      findingsJson: "[]", plainLanguageExplanation: "Across all reports reviewed, nothing appears abnormal.",
      modelUsed: "mock-analyzer", promptVersion: "seed-v2",
    },
  });

  const nehaEnc = await prisma.encounter.create({
    data: { patientId: neha.id, admissionDate: daysAgo(1), ward: "General Medicine", admittingDoctorId: doctor.id },
  });
  const nehaR1 = await prisma.report.create({
    data: {
      encounterId: nehaEnc.id, type: "BLOOD", fileObjectKey: "none", originalFilename: "blood-panel.txt",
      structuredValuesJson: JSON.stringify([{ test: "WBC", value: 14.2, unit: "10^3/uL" }, { test: "Hemoglobin", value: 11.1, unit: "g/dL" }]),
      status: "UPLOADED", uploadedById: doctor.id,
    },
  });
  const nehaR2 = await prisma.report.create({
    data: {
      encounterId: nehaEnc.id, type: "CLINICAL_NOTE", fileObjectKey: "none", originalFilename: "clinical-note.txt",
      textContent: "Patient reports mild fever overnight, otherwise stable.",
      status: "UPLOADED", uploadedById: doctor.id,
    },
  });

  // 3. Karan Malhotra — post-op diagnostic report, freshly uploaded.
  const karan = await prisma.patient.create({
    data: { name: "Karan Malhotra", dob: new Date("1971-09-02"), gender: "Male", contactPhone: "+15550007777" },
  });
  const karanEnc = await prisma.encounter.create({
    data: { patientId: karan.id, admissionDate: daysAgo(1), ward: "Orthopedics", admittingDoctorId: doctor.id },
  });
  const karanR1 = await prisma.report.create({
    data: {
      encounterId: karanEnc.id, type: "DIAGNOSTIC", fileObjectKey: "none", originalFilename: "xray-report.txt",
      textContent: "Post-operative X-ray shows healing progressing normally.",
      status: "UPLOADED", uploadedById: doctor.id,
    },
  });

  // ---------- Management queue: exactly 2 patients awaiting operational sign-off ----------

  // 4. Farhan Ali — caregiver required, so Caregiver Matching has something to show.
  const farhan = await prisma.patient.create({
    data: { name: "Farhan Ali", dob: new Date("1978-11-02"), gender: "Male", contactPhone: "+15550003333" },
  });
  const farhanEnc = await prisma.encounter.create({
    data: {
      patientId: farhan.id, admissionDate: daysAgo(4), ward: "Orthopedics", admittingDoctorId: doctor.id,
      overallStatus: "MANAGEMENT_REVIEW",
    },
  });
  const farhanReport = await prisma.report.create({
    data: {
      encounterId: farhanEnc.id, type: "DIAGNOSTIC", fileObjectKey: "none", originalFilename: "xray-report.txt",
      textContent: "Post-operative X-ray shows proper alignment, no complications noted.",
      status: "ANALYZED", uploadedById: doctor.id,
    },
  });
  await prisma.aIAnalysis.create({
    data: {
      reportId: farhanReport.id, encounterId: farhanEnc.id, scope: "PER_REPORT",
      summaryText: "Diagnostic report reviewed — all captured values are within normal reference ranges.",
      findingsJson: "[]", plainLanguageExplanation: "In simple terms: nothing stands out as abnormal.",
      modelUsed: "mock-analyzer", promptVersion: "seed-v2",
    },
  });
  await prisma.aIAnalysis.create({
    data: {
      encounterId: farhanEnc.id, scope: "OVERALL",
      summaryText: "Overall review across 1 report(s) for Farhan Ali: no abnormal findings identified.",
      findingsJson: "[]", plainLanguageExplanation: "Across all reports reviewed, nothing appears abnormal.",
      modelUsed: "mock-analyzer", promptVersion: "seed-v2",
    },
  });
  await prisma.dischargeDecisionMedical.create({
    data: {
      encounterId: farhanEnc.id, doctorId: doctor.id, medicalStatus: "MEDICAL_READY", caregiverRequired: true,
      doctorNotes: "Post-op recovery on track. Needs a caregiver at home for the first week.", decidedAt: daysAgo(1),
    },
  });
  await prisma.prescription.create({
    data: { encounterId: farhanEnc.id, medicineName: "Ibuprofen", dosage: "400mg", frequency: "three times daily", durationDays: 7, startDate: new Date(), instructions: "Take after meals" },
  });
  await prisma.appointment.create({
    data: { encounterId: farhanEnc.id, type: "Orthopedics Follow-up", scheduledDate: daysFromNow(14) },
  });

  // 5. Priya Sharma — no caregiver needed, straightforward operational review.
  const priya = await prisma.patient.create({
    data: { name: "Priya Sharma", dob: new Date("1994-02-19"), gender: "Female", contactPhone: "+15550008888" },
  });
  const priyaEnc = await prisma.encounter.create({
    data: {
      patientId: priya.id, admissionDate: daysAgo(3), ward: "General Medicine", admittingDoctorId: doctor.id,
      overallStatus: "MANAGEMENT_REVIEW",
    },
  });
  const priyaReport = await prisma.report.create({
    data: {
      encounterId: priyaEnc.id, type: "BLOOD", fileObjectKey: "none", originalFilename: "blood-panel.txt",
      structuredValuesJson: JSON.stringify([{ test: "Glucose", value: 118, unit: "mg/dL" }]),
      status: "ANALYZED", uploadedById: doctor.id,
    },
  });
  await prisma.aIAnalysis.create({
    data: {
      reportId: priyaReport.id, encounterId: priyaEnc.id, scope: "PER_REPORT",
      summaryText: "Blood panel reviewed — all captured values are within normal reference ranges.",
      findingsJson: "[]", plainLanguageExplanation: "In simple terms: nothing stands out as abnormal.",
      modelUsed: "mock-analyzer", promptVersion: "seed-v2",
    },
  });
  await prisma.aIAnalysis.create({
    data: {
      encounterId: priyaEnc.id, scope: "OVERALL",
      summaryText: "Overall review across 1 report(s) for Priya Sharma: no abnormal findings identified.",
      findingsJson: "[]", plainLanguageExplanation: "Across all reports reviewed, nothing appears abnormal.",
      modelUsed: "mock-analyzer", promptVersion: "seed-v2",
    },
  });
  await prisma.dischargeDecisionMedical.create({
    data: {
      encounterId: priyaEnc.id, doctorId: doctor.id, medicalStatus: "MEDICAL_READY", caregiverRequired: false,
      doctorNotes: "Stable, ready for discharge pending admin checks.", decidedAt: daysAgo(1),
    },
  });
  await prisma.prescription.create({
    data: { encounterId: priyaEnc.id, medicineName: "Metformin", dosage: "500mg", frequency: "twice daily", durationDays: 10, startDate: new Date(), instructions: "Take with food" },
  });
  await prisma.appointment.create({
    data: { encounterId: priyaEnc.id, type: "General Medicine Follow-up", scheduledDate: daysFromNow(10) },
  });

  // ---------- Already resolved: keeps care-plan / blocker views demoable ----------

  // 6. Ramesh Gupta — fully approved with a live care plan + reminders.
  const ramesh = await prisma.patient.create({
    data: { name: "Ramesh Gupta", dob: new Date("1965-03-12"), gender: "Male", contactPhone: "+15550001111" },
  });
  const rameshEnc = await prisma.encounter.create({
    data: {
      patientId: ramesh.id, admissionDate: daysAgo(10), dischargeDate: daysAgo(6), ward: "General Medicine",
      admittingDoctorId: doctor.id, overallStatus: "DISCHARGE_APPROVED",
    },
  });
  await prisma.dischargeDecisionMedical.create({
    data: { encounterId: rameshEnc.id, doctorId: doctor.id, medicalStatus: "MEDICAL_READY", caregiverRequired: false, doctorNotes: "Stable, recovered well.", decidedAt: daysAgo(7) },
  });
  await prisma.managementReview.create({
    data: {
      encounterId: rameshEnc.id, managementUserId: management.id, caregiverAvailable: true, insuranceStatus: "CLEARED",
      billingStatus: "CLEARED", documentsStatus: "COMPLETE", managementStatus: "APPROVED", reviewedAt: daysAgo(6),
    },
  });
  await prisma.prescription.create({
    data: { encounterId: rameshEnc.id, medicineName: "Amoxicillin", dosage: "500mg", frequency: "twice daily", durationDays: 5, startDate: daysAgo(6), instructions: "Take with food" },
  });
  const carePlan = await prisma.carePlan.create({ data: { encounterId: rameshEnc.id, dischargeDate: daysAgo(6), status: "ACTIVE" } });
  const carePlanItem = await prisma.carePlanItem.create({
    data: { carePlanId: carePlan.id, itemType: "MEDICINE_DOSE", scheduledAt: daysAgo(5), description: "Amoxicillin 500mg — Take with food", status: "DONE" },
  });
  await prisma.reminderLog.create({
    data: { carePlanItemId: carePlanItem.id, channel: "WHATSAPP", scheduledAt: daysAgo(5), sentAt: daysAgo(5), status: "SENT", providerMessageId: "console-seed-1" },
  });

  // 7. Meera Nair — blocked on caregiver, demonstrates Discharge Blocker Intelligence.
  const meera = await prisma.patient.create({
    data: { name: "Meera Nair", dob: new Date("1955-01-30"), gender: "Female", contactPhone: "+15550004444" },
  });
  const meeraEnc = await prisma.encounter.create({
    data: {
      patientId: meera.id, admissionDate: daysAgo(5), ward: "General Medicine", admittingDoctorId: doctor.id,
      overallStatus: "DISCHARGE_FAILED", failureStage: "MANAGEMENT", failureTag: "CAREGIVER_UNAVAILABLE",
    },
  });
  await prisma.dischargeDecisionMedical.create({
    data: { encounterId: meeraEnc.id, doctorId: doctor.id, medicalStatus: "MEDICAL_READY", caregiverRequired: true, doctorNotes: "Ready medically, requires a caregiver at home.", decidedAt: daysAgo(2) },
  });
  await prisma.managementReview.create({
    data: {
      encounterId: meeraEnc.id, managementUserId: management.id, caregiverAvailable: false, insuranceStatus: "CLEARED",
      billingStatus: "CLEARED", documentsStatus: "COMPLETE", otherNotes: "Family unable to arrange a caregiver this week.",
      managementStatus: "FAILED", failureTag: "CAREGIVER_UNAVAILABLE", reviewedAt: daysAgo(1),
    },
  });

  // Enqueue analysis jobs for every freshly-uploaded report — the worker
  // picks these up within ~1s, so the doctor queue's AI summaries appear live.
  await prisma.job.createMany({
    data: [sunitaR1, sunitaR2, nehaR1, nehaR2, karanR1].map((r) => ({
      type: "ANALYZE_REPORT",
      payload: JSON.stringify({ reportId: r.id }),
    })),
  });

  return {
    users: 2,
    patients: 7,
    doctorQueue: 3,
    managementQueue: 2,
  };
}
