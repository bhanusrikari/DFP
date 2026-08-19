import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { StatusBadge } from "../components/StatusBadge";
import { ChecklistCluster } from "../components/ChecklistCluster";
import { BlockerChip } from "../components/BlockerChip";
import { AgeingTimer, ageingTier } from "../components/AgeingTimer";
import { DischargeBlockerPanel } from "../components/DischargeBlockerPanel";
import { CaregiverMatchPanel } from "../components/CaregiverMatchPanel";
import { ManagementChecklistForm } from "../components/ManagementChecklistForm";
import { CheckCircleIcon, ClockIcon, UsersIcon, XCircleIcon } from "../components/Icons";

type ChecklistState = "SATISFIED" | "OUTSTANDING" | "IN_PROGRESS" | "NOT_REQUIRED";
interface WorklistRow {
  id: string;
  patient: { id: string; name: string; ageYears: number };
  ward: string | null;
  overallStatus: string;
  dischargeDate: string | null;
  readySince: string | null;
  ageingMs: number;
  caregiverRequired: boolean;
  checklist: { caregiver: ChecklistState; insurance: ChecklistState; billing: ChecklistState; documents: ChecklistState };
  dischargeBlockers: {
    status: "BLOCKED" | "CLEAR" | "NOT_YET_REVIEWED";
    primaryBlocker: { tag: string; stage: string; reason: string; actionRequired: string } | null;
    blockers: { tag: string }[];
    completed: { label: string }[];
  };
  caregiverMatch: unknown;
}

type Filter = "AWAITING" | "BLOCKED" | "CAREGIVER" | "APPROVED" | "ALL";

function initials(name: string): string {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("");
}
function isToday(iso: string | null): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

// Discharge Board — a worklist, not a browsing dashboard. Fetches the
// deliberately non-clinical /api/management/worklist projection (NFR-2:
// management sees the outcome of medical review, never its content).
export function ManagementDashboard() {
  const [rows, setRows] = useState<WorklistRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("AWAITING");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  function load() {
    api.get<WorklistRow[]>("/api/management/worklist").then((res) => {
      setRows(res);
      setLoading(false);
    });
  }
  useEffect(load, []);

  const counts = useMemo(
    () => ({
      awaiting: rows.filter((r) => r.overallStatus === "MANAGEMENT_REVIEW").length,
      blocked: rows.filter((r) => r.overallStatus === "DISCHARGE_FAILED").length,
      caregiver: rows.filter((r) => r.overallStatus === "MANAGEMENT_REVIEW" && r.caregiverRequired && r.checklist.caregiver !== "SATISFIED").length,
      approvedToday: rows.filter((r) => r.overallStatus === "DISCHARGE_APPROVED" && isToday(r.dischargeDate)).length,
    }),
    [rows]
  );

  const byFilter = rows.filter((r) => {
    if (filter === "AWAITING") return r.overallStatus === "MANAGEMENT_REVIEW";
    if (filter === "BLOCKED") return r.overallStatus === "DISCHARGE_FAILED";
    if (filter === "CAREGIVER") return r.caregiverRequired && r.checklist.caregiver !== "SATISFIED";
    if (filter === "APPROVED") return r.overallStatus === "DISCHARGE_APPROVED";
    return true;
  });
  const filtered = byFilter
    .filter((r) => r.patient.name.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => b.ageingMs - a.ageingMs); // oldest blocker first — it's the one costing a bed

  const selected = rows.find((r) => r.id === selectedId) ?? null;

  return (
    <div className="flex gap-6">
      <div className="min-w-0 flex-1">
        <h1 className="font-display text-2xl font-bold tracking-tight">Discharge board</h1>
        <p className="mt-1 text-sm text-gray-500">
          {counts.awaiting} waiting · {counts.blocked} blocked · {counts.caregiver} need caregiver
        </p>

        <div className="mt-6 grid grid-cols-4 gap-4">
          <SummaryCard active={filter === "AWAITING"} onClick={() => setFilter("AWAITING")} tile="bg-accent-soft text-accent-dark" icon={<ClockIcon className="h-5 w-5" />} count={counts.awaiting} label="Awaiting review" />
          <SummaryCard active={filter === "BLOCKED"} onClick={() => setFilter("BLOCKED")} tile="bg-critical-soft text-critical" icon={<XCircleIcon className="h-5 w-5" />} count={counts.blocked} label="Blocked" />
          <SummaryCard active={filter === "CAREGIVER"} onClick={() => setFilter("CAREGIVER")} tile="bg-warn-soft text-warn" icon={<UsersIcon className="h-5 w-5" />} count={counts.caregiver} label="Caregiver needed" />
          <SummaryCard active={filter === "APPROVED"} onClick={() => setFilter("APPROVED")} tile="bg-success-soft text-success" icon={<CheckCircleIcon className="h-5 w-5" />} count={counts.approvedToday} label="Approved today" />
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setFilter("ALL")}
            className={`rounded-full px-4 py-2 text-sm font-medium shadow-card ${filter === "ALL" ? "bg-ink text-white" : "border border-gray-200 bg-white text-gray-500"}`}
          >
            All patients
          </button>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by patient name…"
            className="flex-1 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm shadow-card placeholder:text-gray-400 focus:border-accent"
          />
        </div>

        {loading && <p className="mt-6 text-sm text-gray-500">Loading…</p>}
        {!loading && filtered.length === 0 && (
          <p className="mt-6 text-sm text-gray-500">
            {rows.length === 0 ? "Nothing waiting. Patients appear here once a doctor marks them medically ready." : "No patients match this filter."}
          </p>
        )}

        {filtered.length > 0 && (
          <div className="mt-4 overflow-x-auto rounded-card border border-border bg-white shadow-card">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50 text-left font-mono text-[11px] uppercase tracking-wide text-gray-400">
                  <th className="w-1 p-0" />
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Ward</th>
                  <th className="px-4 py-3">Ready since</th>
                  <th className="px-4 py-3">Checklist</th>
                  <th className="px-4 py-3">Primary blocker</th>
                  <th className="px-4 py-3">Ageing</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const tier = ageingTier(r.ageingMs);
                  const borderColor = tier === "stale" ? "bg-critical" : tier === "ageing" ? "bg-warn" : "bg-transparent";
                  return (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedId(r.id)}
                      className={`h-16 cursor-pointer border-b border-border last:border-b-0 hover:bg-gray-50 ${selectedId === r.id ? "bg-accent-soft/40" : ""}`}
                    >
                      <td className={`w-1 p-0 ${borderColor}`} />
                      <td className="px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft font-display text-xs font-bold text-accent-dark">
                            {initials(r.patient.name)}
                          </div>
                          <div>
                            <p className="font-medium leading-tight">{r.patient.name}</p>
                            <p className="font-mono text-[11px] text-gray-400">{r.patient.ageYears}y</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 text-gray-600">{r.ward ?? "—"}</td>
                      <td className="px-4 text-gray-600">{r.readySince ? new Date(r.readySince).toLocaleString(undefined, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                      <td className="px-4">
                        <ChecklistCluster checklist={r.checklist} />
                      </td>
                      <td className="px-4">
                        <BlockerChip tag={r.dischargeBlockers.primaryBlocker?.tag ?? null} extraCount={r.dischargeBlockers.blockers.length - 1} />
                      </td>
                      <td className="px-4">{r.readySince ? <AgeingTimer ms={r.ageingMs} /> : <span className="text-gray-300">—</span>}</td>
                      <td className="px-4">
                        <StatusBadge status={r.overallStatus} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <DetailRail
          key={selected.id}
          row={selected}
          onClose={() => setSelectedId(null)}
          onChanged={() => {
            load();
          }}
        />
      )}
    </div>
  );
}

function SummaryCard({
  active,
  onClick,
  tile,
  icon,
  count,
  label,
}: {
  active: boolean;
  onClick: () => void;
  tile: string;
  icon: React.ReactNode;
  count: number;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-card border bg-white p-5 text-left shadow-card transition-transform hover:-translate-y-0.5 ${active ? "border-accent ring-2 ring-accent" : "border-border"}`}
    >
      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-tile ${tile}`}>{icon}</div>
      <p className="mt-3 font-display text-3xl font-extrabold">{count}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </button>
  );
}

function DetailRail({ row, onClose, onChanged }: { row: WorklistRow; onClose: () => void; onChanged: () => void }) {
  return (
    <aside className="sticky top-8 h-fit w-[360px] shrink-0 space-y-4">
      <div className="rounded-card border border-border bg-white p-5 shadow-panel">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-display text-lg font-bold">{row.patient.name}</p>
            <p className="text-xs text-gray-500">
              {row.patient.ageYears}y · {row.ward ?? "Ward —"}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Ready since {row.readySince ? new Date(row.readySince).toLocaleString() : "—"}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>
        <Link to={`/patients/${row.id}`} className="mt-3 inline-block text-xs font-medium text-accent-dark hover:underline">
          View full clinical record →
        </Link>
      </div>

      <DischargeBlockerPanel report={row.dischargeBlockers as any} />

      {!!row.caregiverMatch && <CaregiverMatchPanel match={row.caregiverMatch as any} />}

      {row.overallStatus === "MANAGEMENT_REVIEW" && (
        <ManagementChecklistForm encounterId={row.id} caregiverRequired={row.caregiverRequired} onSubmitted={() => { onChanged(); onClose(); }} />
      )}
    </aside>
  );
}
