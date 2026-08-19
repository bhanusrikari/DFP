// Feature: Discharge Blocker Intelligence. Derived, read-only — computed from
// data management already entered, never a new source of truth. Answers
// "why can't this patient be discharged, and what needs to be done?" instead
// of just showing DISCHARGE_FAILED.

export interface BlockerInfo {
  tag: string;
  stage: "MEDICAL" | "MANAGEMENT";
  reason: string;
  actionRequired: string;
}

export interface CompletedItem {
  label: string;
}

export interface DischargeBlockerReport {
  status: "BLOCKED" | "CLEAR" | "NOT_YET_REVIEWED";
  primaryBlocker: BlockerInfo | null;
  blockers: BlockerInfo[];
  completed: CompletedItem[];
}

const BLOCKER_PRIORITY = [
  "CAREGIVER_UNAVAILABLE",
  "INSURANCE_PENDING",
  "BILLING_PENDING",
  "DOCUMENTS_INCOMPLETE",
  "APPOINTMENT_NOT_SCHEDULED",
  "OTHER_ADMINISTRATIVE_ISSUE",
];

export function computeDischargeBlockers(input: {
  medicalDecision: { medicalStatus: string; caregiverRequired: boolean } | null;
  managementReview: {
    caregiverAvailable: boolean | null;
    insuranceStatus: string;
    billingStatus: string;
    documentsStatus: string;
    managementStatus: string;
    failureTag: string | null;
    otherNotes: string | null;
  } | null;
  appointmentCount: number;
  overallStatus: string;
}): DischargeBlockerReport {
  const { medicalDecision, managementReview, appointmentCount, overallStatus } = input;

  const completed: CompletedItem[] = [];
  if (medicalDecision?.medicalStatus === "MEDICAL_READY") completed.push({ label: "Medical approval" });

  if (!managementReview) {
    return {
      status: medicalDecision?.medicalStatus === "MEDICAL_READY" ? "NOT_YET_REVIEWED" : "NOT_YET_REVIEWED",
      primaryBlocker: null,
      blockers: [],
      completed,
    };
  }

  const blockers: BlockerInfo[] = [];

  if (medicalDecision?.caregiverRequired) {
    if (managementReview.caregiverAvailable === false) {
      blockers.push({
        tag: "CAREGIVER_UNAVAILABLE",
        stage: "MANAGEMENT",
        reason: "A caregiver is required for this patient but none is currently available.",
        actionRequired: "Assign an available caregiver.",
      });
    } else if (managementReview.caregiverAvailable === true) {
      completed.push({ label: "Caregiver arranged" });
    }
  }

  if (managementReview.insuranceStatus !== "CLEARED") {
    blockers.push({
      tag: "INSURANCE_PENDING",
      stage: "MANAGEMENT",
      reason: "Insurance approval has not been confirmed.",
      actionRequired: "Follow up with insurance provider to clear approval.",
    });
  } else {
    completed.push({ label: "Insurance" });
  }

  if (managementReview.billingStatus !== "CLEARED") {
    blockers.push({
      tag: "BILLING_PENDING",
      stage: "MANAGEMENT",
      reason: "Billing has not been fully settled.",
      actionRequired: "Resolve outstanding billing/payment items.",
    });
  } else {
    completed.push({ label: "Billing" });
  }

  if (managementReview.documentsStatus !== "COMPLETE") {
    blockers.push({
      tag: "DOCUMENTS_INCOMPLETE",
      stage: "MANAGEMENT",
      reason: "Required discharge documents have not been completed.",
      actionRequired: "Collect and complete the outstanding documents.",
    });
  } else {
    completed.push({ label: "Documents" });
  }

  if (appointmentCount === 0 && overallStatus !== "DISCHARGE_APPROVED") {
    blockers.push({
      tag: "APPOINTMENT_NOT_SCHEDULED",
      stage: "MEDICAL",
      reason: "No follow-up appointment has been scheduled yet.",
      actionRequired: "Schedule a follow-up appointment before discharge.",
    });
  }

  if (managementReview.managementStatus === "FAILED" && managementReview.failureTag === "OTHER_ADMINISTRATIVE_ISSUE") {
    blockers.push({
      tag: "OTHER_ADMINISTRATIVE_ISSUE",
      stage: "MANAGEMENT",
      reason: managementReview.otherNotes || "An administrative issue is blocking discharge.",
      actionRequired: "Resolve the administrative issue noted by management.",
    });
  }

  blockers.sort((a, b) => BLOCKER_PRIORITY.indexOf(a.tag) - BLOCKER_PRIORITY.indexOf(b.tag));

  // The tag management actually submitted as the final reason wins the primary slot if present.
  const submitted = blockers.find((b) => b.tag === managementReview.failureTag) ?? blockers[0] ?? null;

  return {
    status: blockers.length > 0 ? "BLOCKED" : "CLEAR",
    primaryBlocker: submitted,
    blockers,
    completed,
  };
}
