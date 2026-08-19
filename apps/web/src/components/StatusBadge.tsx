const STYLES: Record<string, string> = {
  // overall / medical
  IN_PROGRESS: "bg-gray-100 text-gray-700",
  MEDICAL_REVIEW: "bg-gray-100 text-gray-700",
  MANAGEMENT_REVIEW: "bg-amber-100 text-warn",
  DISCHARGE_APPROVED: "bg-emerald-100 text-success",
  DISCHARGE_FAILED: "bg-red-100 text-critical",
  MEDICAL_READY: "bg-emerald-100 text-success",
  MEDICAL_NOT_READY: "bg-red-100 text-critical",
  // management
  PENDING: "bg-amber-100 text-warn",
  APPROVED: "bg-emerald-100 text-success",
  FAILED: "bg-red-100 text-critical",
  // severity
  LOW: "bg-gray-100 text-gray-700",
  MODERATE: "bg-amber-100 text-warn",
  HIGH: "bg-red-100 text-critical",
  // reminder
  SCHEDULED: "bg-gray-100 text-gray-700",
  SENT: "bg-emerald-100 text-success",
  ACKNOWLEDGED: "bg-emerald-100 text-success",
};

export function StatusBadge({ status }: { status: string }) {
  const style = STYLES[status] ?? "bg-gray-100 text-gray-700";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-mono font-medium ${style}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}
