const CHIP_STYLES: Record<string, string> = {
  CAREGIVER_UNAVAILABLE: "bg-warn-soft text-warn",
  INSURANCE_PENDING: "bg-critical-soft text-critical",
  BILLING_PENDING: "bg-critical-soft text-critical",
  DOCUMENTS_INCOMPLETE: "bg-warn-soft text-warn",
  APPOINTMENT_NOT_SCHEDULED: "bg-accent-soft text-accent-dark",
  OTHER_ADMINISTRATIVE_ISSUE: "bg-neutral-soft text-gray-500",
};

const CHIP_LABELS: Record<string, string> = {
  CAREGIVER_UNAVAILABLE: "Caregiver",
  INSURANCE_PENDING: "Insurance",
  BILLING_PENDING: "Billing",
  DOCUMENTS_INCOMPLETE: "Documents",
  APPOINTMENT_NOT_SCHEDULED: "Appointment",
  OTHER_ADMINISTRATIVE_ISSUE: "Other",
};

// Primary blocker chip + "+N" for additional simultaneous blockers (REQ-7.5.2).
export function BlockerChip({ tag, extraCount }: { tag: string | null; extraCount?: number }) {
  if (!tag) return <span className="text-xs text-gray-400">—</span>;
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${CHIP_STYLES[tag] ?? "bg-neutral-soft text-gray-500"}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        {CHIP_LABELS[tag] ?? tag.replaceAll("_", " ")}
      </span>
      {!!extraCount && extraCount > 0 && <span className="text-xs text-gray-400">+{extraCount}</span>}
    </span>
  );
}
