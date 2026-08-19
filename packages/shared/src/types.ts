// Shared vocabulary between apps/api and apps/web.
// These string unions ARE the PRD's status vocabulary (PRD.md sections 2-8) — keep them in sync with it.

export const Role = {
  DOCTOR: "DOCTOR",
  MANAGEMENT: "MANAGEMENT",
  ADMIN: "ADMIN",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const MedicalStatus = {
  MEDICAL_READY: "MEDICAL_READY",
  MEDICAL_NOT_READY: "MEDICAL_NOT_READY",
} as const;
export type MedicalStatus = (typeof MedicalStatus)[keyof typeof MedicalStatus];

export const ManagementStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  FAILED: "FAILED",
} as const;
export type ManagementStatus = (typeof ManagementStatus)[keyof typeof ManagementStatus];

export const FailureTag = {
  CAREGIVER_UNAVAILABLE: "CAREGIVER_UNAVAILABLE",
  INSURANCE_PENDING: "INSURANCE_PENDING",
  BILLING_PENDING: "BILLING_PENDING",
  DOCUMENTS_INCOMPLETE: "DOCUMENTS_INCOMPLETE",
  APPOINTMENT_NOT_SCHEDULED: "APPOINTMENT_NOT_SCHEDULED",
  OTHER_ADMINISTRATIVE_ISSUE: "OTHER_ADMINISTRATIVE_ISSUE",
} as const;
export type FailureTag = (typeof FailureTag)[keyof typeof FailureTag];

export const FailureStage = {
  MEDICAL: "MEDICAL",
  MANAGEMENT: "MANAGEMENT",
} as const;
export type FailureStage = (typeof FailureStage)[keyof typeof FailureStage];

export const OverallStatus = {
  IN_PROGRESS: "IN_PROGRESS",
  MEDICAL_REVIEW: "MEDICAL_REVIEW",
  MANAGEMENT_REVIEW: "MANAGEMENT_REVIEW",
  DISCHARGE_APPROVED: "DISCHARGE_APPROVED",
  DISCHARGE_FAILED: "DISCHARGE_FAILED",
} as const;
export type OverallStatus = (typeof OverallStatus)[keyof typeof OverallStatus];

export const ReportType = {
  BLOOD: "BLOOD",
  DIAGNOSTIC: "DIAGNOSTIC",
  CLINICAL_NOTE: "CLINICAL_NOTE",
  MEDICATION: "MEDICATION",
  OTHER: "OTHER",
} as const;
export type ReportType = (typeof ReportType)[keyof typeof ReportType];

export const ReportStatus = {
  UPLOADED: "UPLOADED",
  PROCESSING: "PROCESSING",
  ANALYZED: "ANALYZED",
  FAILED: "FAILED",
} as const;
export type ReportStatus = (typeof ReportStatus)[keyof typeof ReportStatus];

export const AIAnalysisScope = {
  PER_REPORT: "PER_REPORT",
  OVERALL: "OVERALL",
} as const;
export type AIAnalysisScope = (typeof AIAnalysisScope)[keyof typeof AIAnalysisScope];

export const Severity = {
  LOW: "LOW",
  MODERATE: "MODERATE",
  HIGH: "HIGH",
} as const;
export type Severity = (typeof Severity)[keyof typeof Severity];

export const CarePlanItemType = {
  MEDICINE_DOSE: "MEDICINE_DOSE",
  APPOINTMENT: "APPOINTMENT",
  INSTRUCTION: "INSTRUCTION",
} as const;
export type CarePlanItemType = (typeof CarePlanItemType)[keyof typeof CarePlanItemType];

export const ReminderChannel = {
  WHATSAPP: "WHATSAPP",
  SMS: "SMS",
  EMAIL: "EMAIL",
} as const;
export type ReminderChannel = (typeof ReminderChannel)[keyof typeof ReminderChannel];

export const ReminderStatus = {
  SCHEDULED: "SCHEDULED",
  SENT: "SENT",
  FAILED: "FAILED",
  ACKNOWLEDGED: "ACKNOWLEDGED",
} as const;
export type ReminderStatus = (typeof ReminderStatus)[keyof typeof ReminderStatus];

export const JobStatus = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
  FAILED: "FAILED",
} as const;
export type JobStatus = (typeof JobStatus)[keyof typeof JobStatus];

export const JobType = {
  ANALYZE_REPORT: "ANALYZE_REPORT",
  ANALYZE_ENCOUNTER_OVERALL: "ANALYZE_ENCOUNTER_OVERALL",
  GENERATE_CARE_PLAN: "GENERATE_CARE_PLAN",
  SEND_REMINDER: "SEND_REMINDER",
} as const;
export type JobType = (typeof JobType)[keyof typeof JobType];

// ---- Shapes shared between the AI provider output and the frontend ----

export interface AIFinding {
  finding: string;
  value?: string;
  referenceRange?: string;
  severity: Severity;
}

export interface AIAnalysisResult {
  summaryText: string;
  findings: AIFinding[];
  plainLanguageExplanation: string;
}
