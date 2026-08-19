interface Caregiver {
  id: string;
  name: string;
  skills: string[];
  availableDurationDays: number;
  currentAssignment: string | null;
}
interface CaregiverRanked {
  caregiver: Caregiver;
  matchedSkills: string[];
  missingSkills: string[];
  available: boolean;
  score: number;
}
interface CaregiverMatchResult {
  requirements: string[];
  requiredDurationDays: number;
  ranked: CaregiverRanked[];
  recommended: Caregiver | null;
  reason: string;
}

// Feature: Caregiver Matching. Answers "which available caregiver is most
// suitable for this patient?" — shown to management once the doctor has
// flagged caregiverRequired=true.
export function CaregiverMatchPanel({ match }: { match: CaregiverMatchResult }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-card p-4">
      <h3 className="font-display text-lg font-semibold">Caregiver matching</h3>

      <div className="mt-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Patient requirements</p>
        <ul className="mt-1 space-y-0.5 text-sm text-ink">
          {match.requirements.map((r) => (
            <li key={r}>✓ {r}</li>
          ))}
          <li>✓ {match.requiredDurationDays}-day support</li>
        </ul>
      </div>

      <div className="mt-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Candidates</p>
        <ol className="mt-1 space-y-2">
          {match.ranked.slice(0, 4).map((r, i) => (
            <li key={r.caregiver.id} className="rounded-md border border-gray-100 p-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {i + 1}. {r.caregiver.name}
                </span>
                {!r.available && <span className="font-mono text-[10px] text-gray-400">unavailable</span>}
              </div>
              <ul className="mt-1 space-y-0.5 text-xs text-gray-600">
                {match.requirements.map((req) => (
                  <li key={req} className={r.matchedSkills.includes(req) ? "text-success" : "text-critical"}>
                    {r.matchedSkills.includes(req) ? "✓" : "✗"} {req}
                  </li>
                ))}
                <li className="text-gray-500">Available {r.caregiver.availableDurationDays} days{r.caregiver.currentAssignment ? ` — ${r.caregiver.currentAssignment}` : ""}</li>
              </ul>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-3 border-t border-gray-200 pt-2">
        {match.recommended ? (
          <p className="text-sm font-medium text-success">Recommended: {match.recommended.name}</p>
        ) : (
          <p className="text-sm font-semibold text-critical">❌ No suitable caregiver available</p>
        )}
        <p className="mt-1 text-xs text-gray-600">{match.reason}</p>
        {!match.recommended && <p className="mt-1 font-mono text-[10px] text-critical">Discharge blocker: CAREGIVER_UNAVAILABLE</p>}
      </div>
    </div>
  );
}
