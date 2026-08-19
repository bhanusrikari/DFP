import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { StatusBadge } from "../components/StatusBadge";
import { ClockIcon, FileTextIcon, StethoscopeIcon } from "../components/Icons";

interface EncounterRow {
  id: string;
  overallStatus: string;
  admissionDate: string;
  patient: { id: string; name: string };
  reports: { status: string }[];
  medicalDecision: { medicalStatus: string } | null;
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
}

export function DoctorDashboard() {
  const [encounters, setEncounters] = useState<EncounterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    api.get<EncounterRow[]>("/api/encounters?queue=doctor").then((res) => {
      setEncounters(res);
      setLoading(false);
    });
  }, []);

  const pendingAnalysis = encounters.filter((e) => e.reports.some((r) => r.status !== "ANALYZED")).length;
  const notReadyCount = encounters.filter((e) => e.medicalDecision?.medicalStatus === "MEDICAL_NOT_READY").length;
  const filtered = encounters.filter((e) => e.patient.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight">Doctor queue</h1>
      <p className="mt-1 text-sm text-gray-500">Patients awaiting a medical discharge decision.</p>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
          <StethoscopeIcon className="h-5 w-5 text-accent" />
          <p className="mt-3 font-display text-3xl font-extrabold">{encounters.length}</p>
          <p className="text-xs text-gray-500">Patients in queue</p>
        </div>
        <div className="rounded-2xl bg-lavender p-5">
          <ClockIcon className="h-5 w-5 text-lavender-ink" />
          <p className="mt-3 font-display text-3xl font-extrabold text-lavender-ink">{pendingAnalysis}</p>
          <p className="text-xs text-lavender-ink/70">AI still analyzing reports</p>
        </div>
        <div className="rounded-2xl bg-cream p-5">
          <FileTextIcon className="h-5 w-5 text-cream-ink" />
          <p className="mt-3 font-display text-3xl font-extrabold text-cream-ink">{notReadyCount}</p>
          <p className="text-xs text-cream-ink/70">Marked not ready</p>
        </div>
      </div>

      {encounters.length > 0 && (
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by patient name…"
          className="mt-6 w-full rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm shadow-card placeholder:text-gray-400 focus:border-accent"
        />
      )}

      {loading && <p className="mt-6 text-sm text-gray-500">Loading…</p>}
      {!loading && encounters.length === 0 && <p className="mt-6 text-sm text-gray-500">No patients waiting.</p>}

      <div className="mt-4 space-y-2">
        {filtered.map((e) => {
          const analyzedCount = e.reports.filter((r) => r.status === "ANALYZED").length;
          return (
            <Link
              key={e.id}
              to={`/patients/${e.id}`}
              className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-card transition-shadow hover:shadow-lg"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft font-display text-sm font-bold text-accent-dark">
                {initials(e.patient.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{e.patient.name}</p>
                <p className="truncate text-xs text-gray-500">
                  Admitted {new Date(e.admissionDate).toLocaleDateString()} · {analyzedCount}/{e.reports.length} reports analyzed
                  {e.medicalDecision ? ` · last decision: ${e.medicalDecision.medicalStatus.replaceAll("_", " ")}` : ""}
                </p>
              </div>
              <StatusBadge status={e.overallStatus} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
