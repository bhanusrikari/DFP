import { prisma } from "../../db.js";

export async function createPatient(input: {
  name: string;
  dob: string;
  gender: string;
  contactPhone?: string;
  mrn?: string;
}) {
  return prisma.patient.create({
    data: {
      name: input.name,
      dob: new Date(input.dob),
      gender: input.gender,
      contactPhone: input.contactPhone,
      mrn: input.mrn,
    },
  });
}

export async function listPatients() {
  return prisma.patient.findMany({ orderBy: { createdAt: "desc" } });
}

// Full cross-visit history for one patient — PRD section 7: "every patient
// must have a unique identifier so that their history can be retrieved
// across multiple hospital visits."
export async function getPatientHistory(patientId: string) {
  return prisma.patient.findUnique({
    where: { id: patientId },
    include: {
      encounters: {
        orderBy: { admissionDate: "desc" },
        include: {
          reports: true,
          aiAnalyses: true,
          medicalDecision: true,
          managementReview: true,
          prescriptions: true,
          appointments: true,
          carePlan: { include: { items: true } },
        },
      },
    },
  });
}

// Captured by Management before discharge so reminders (WhatsApp doses,
// day-ahead appointment notices, optional email) have somewhere to go.
export async function updatePatientContact(
  patientId: string,
  input: { contactPhone?: string | null; contactPhone2?: string | null; email?: string | null }
) {
  return prisma.patient.update({
    where: { id: patientId },
    data: {
      contactPhone: input.contactPhone,
      contactPhone2: input.contactPhone2,
      email: input.email,
    },
  });
}

export async function createEncounter(patientId: string, input: { ward?: string; admittingDoctorId?: string }) {
  return prisma.encounter.create({
    data: {
      patientId,
      ward: input.ward,
      admittingDoctorId: input.admittingDoctorId,
    },
  });
}
