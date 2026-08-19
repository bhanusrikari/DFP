interface BlockerInfo {
  tag: string;
  stage: string;
  reason: string;
  actionRequired: string;
}
interface DischargeBlockerReport {
  status: "BLOCKED" | "CLEAR" | "NOT_YET_REVIEWED";
  primaryBlocker: BlockerInfo | null;
  blockers: BlockerInfo[];
  completed: { label: string }[];
}

// Feature: Discharge Blocker Intelligence. Answers "why can't this patient be
// discharged, and what needs to be done?" instead of just a status code.
export function DischargeBlockerPanel({ report }: { report: DischargeBlockerReport }) {
  if (report.status === "NOT_YET_REVIEWED") return null;

  return (
    <div className={`rounded-lg border p-4 ${report.status === "BLOCKED" ? "border-red-200 bg-red-50" : "border-emerald-200 bg-emerald-50"}`}>
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-wide text-gray-500">Discharge status</span>
        <span className={`font-mono text-xs font-semibold ${report.status === "BLOCKED" ? "text-critical" : "text-success"}`}>
          {report.status}
        </span>
      </div>

      {report.primaryBlocker && (
        <div className="mt-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Primary blocker</p>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-critical">
            🔴 {report.primaryBlocker.tag.replaceAll("_", " ")}
          </p>
          <p className="mt-1 text-sm text-gray-700">{report.primaryBlocker.reason}</p>
        </div>
      )}

      {report.blockers.length > 1 && (
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">All blockers</p>
          <ul className="mt-1 space-y-1 text-sm text-gray-700">
            {report.blockers.map((b) => (
              <li key={b.tag}>🔴 {b.tag.replaceAll("_", " ")}</li>
            ))}
          </ul>
        </div>
      )}

      {report.completed.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Completed</p>
          <ul className="mt-1 space-y-1 text-sm text-success">
            {report.completed.map((c) => (
              <li key={c.label}>✓ {c.label}</li>
            ))}
          </ul>
        </div>
      )}

      {report.primaryBlocker && (
        <div className="mt-3 border-t border-gray-200 pt-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Action required</p>
          <p className="mt-1 text-sm font-medium text-ink">{report.primaryBlocker.actionRequired}</p>
        </div>
      )}

      {report.status === "CLEAR" && <p className="mt-2 text-sm text-success">All operational requirements are clear.</p>}
    </div>
  );
}
