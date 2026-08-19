interface LabChange {
  kind: "LAB";
  test: string;
  previous: string;
  current: string;
  direction: string;
  status: "IMPROVED" | "WORSENED" | "CHANGED";
}
interface MedicationChange {
  kind: "MEDICATION";
  medicineName: string;
  status: "ADDED" | "REMOVED";
}
interface FindingsTrendChange {
  kind: "FINDINGS_TREND";
  previousCount: number;
  currentCount: number;
  status: "IMPROVED" | "WORSENED";
}
type HistoricalChange = LabChange | MedicationChange | FindingsTrendChange;
interface HistoricalComparison {
  hasPreviousVisit: boolean;
  previousVisitDate: string | null;
  currentVisitDate: string;
  changes: HistoricalChange[];
}

const fmt = (d: string) => new Date(d).toLocaleDateString(undefined, { day: "2-digit", month: "short" });

// Feature: Historical Change Detection. Answers "what has changed since the
// patient's previous visit?" — deterministic diff, shown on the doctor dashboard.
export function HistoryComparisonPanel({ comparison }: { comparison: HistoricalComparison }) {
  if (!comparison.hasPreviousVisit) return null;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">Patient history comparison</h3>
        <span className="font-mono text-xs text-gray-400">
          {fmt(comparison.previousVisitDate!)} → {fmt(comparison.currentVisitDate)}
        </span>
      </div>

      {comparison.changes.length === 0 ? (
        <p className="mt-2 text-sm text-gray-500">No medically or operationally meaningful changes detected since the last visit.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {comparison.changes.map((c, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className={c.status === "IMPROVED" ? "text-success" : c.status === "WORSENED" ? "text-critical" : "text-warn"}>
                {c.status === "IMPROVED" ? "✓" : "⚠"}
              </span>
              {c.kind === "LAB" && (
                <span>
                  <b>{c.test}</b> — previous: {c.previous}, current: {c.current} ({c.status.toLowerCase()}, {c.direction.toLowerCase()})
                </span>
              )}
              {c.kind === "MEDICATION" && (
                <span>
                  Medication {c.status === "ADDED" ? "added" : "removed"}: <b>{c.medicineName}</b>
                </span>
              )}
              {c.kind === "FINDINGS_TREND" && (
                <span>
                  Abnormal findings {c.status === "IMPROVED" ? "decreased" : "increased"}: {c.previousCount} → {c.currentCount}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
