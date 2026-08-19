import { useEffect, useState } from "react";
import { api } from "../api/client";

interface AuditEntry {
  id: string;
  entityType: string;
  action: string;
  actorRole: string | null;
  timestamp: string;
}

// Wires up GET /api/encounters/:id/audit — every write in this app already
// goes through audit.service.ts, but nothing surfaced the trail in the UI.
export function AuditTrailPanel({ encounterId }: { encounterId: string }) {
  const [entries, setEntries] = useState<AuditEntry[] | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open && entries === null) {
      api.get<AuditEntry[]>(`/api/encounters/${encounterId}/audit`).then(setEntries);
    }
  }, [open, entries, encounterId]);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-card p-4">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between text-left">
        <span className="font-display text-lg font-bold">Audit trail</span>
        <span className="font-mono text-xs text-gray-400">{open ? "hide" : "show"}</span>
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          {entries === null && <p className="text-sm text-gray-500">Loading…</p>}
          {entries?.length === 0 && <p className="text-sm text-gray-500">No recorded actions yet.</p>}
          {entries?.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between border-t border-gray-100 pt-2 text-sm first:border-t-0 first:pt-0">
              <span>
                <span className="font-medium">{entry.action.replaceAll("_", " ")}</span>
                <span className="text-gray-400"> — {entry.entityType}</span>
              </span>
              <span className="font-mono text-xs text-gray-400">
                {entry.actorRole ?? "SYSTEM"} · {new Date(entry.timestamp).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
