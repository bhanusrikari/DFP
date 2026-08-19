import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Role } from "@dfp/shared";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { StatusBadge } from "../components/StatusBadge";
import { ChevronLeftIcon, PlusIcon } from "../components/Icons";

interface EncounterSummary {
  id: string;
  overallStatus: string;
  admissionDate: string;
  dischargeDate: string | null;
  ward: string | null;
  reports: unknown[];
  medicalDecision: { medicalStatus: string } | null;
  managementReview: { managementStatus: string; failureTag: string | null } | null;
}
interface PatientWithHistory {
  id: string;
  name: string;
  dob: string;
  gender: string;
  contactPhone: string | null;
  encounters: EncounterSummary[];
}

// Wires up GET /api/patients/:id/history — the PRD's "permanently maintains
// the patient's historical records... retrievable across multiple hospital
// visits" requirement, previously backend-only with no screen to view it.
export function PatientHistoryPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<PatientWithHistory | null>(null);
  const [creating, setCreating] = useState(false);

  function load() {
    if (!patientId) return;
    api.get<PatientWithHistory>(`/api/patients/${patientId}/history`).then(setPatient);
  }

  useEffect(load, [patientId]);

  async function startNewEncounter() {
    if (!patientId) return;
    setCreating(true);
    try {
      const encounter = await api.post<{ id: string }>(`/api/patients/${patientId}/encounters`, {});
      navigate(`/patients/${encounter.id}`);
    } finally {
      setCreating(false);
    }
  }

  if (!patient) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div>
      <Link to="/patients" className="mb-4 inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-accent-dark">
        <ChevronLeftIcon className="h-3.5 w-3.5" />
        All patients
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">{patient.name}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {patient.gender} · DOB {new Date(patient.dob).toLocaleDateString()}
            {patient.contactPhone ? ` · ${patient.contactPhone}` : ""}
          </p>
        </div>
        {(user?.role === Role.DOCTOR || user?.role === Role.ADMIN) && (
          <button
            type="button"
            disabled={creating}
            onClick={startNewEncounter}
            className="flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            <PlusIcon className="h-4 w-4" />
            {creating ? "Starting…" : "New encounter"}
          </button>
        )}
      </div>

      <h2 className="mt-8 font-display text-lg font-bold">Visit history ({patient.encounters.length})</h2>
      <div className="mt-3 space-y-2">
        {patient.encounters.length === 0 && <p className="text-sm text-gray-500">No visits recorded yet.</p>}
        {patient.encounters.map((e) => (
          <Link
            key={e.id}
            to={`/patients/${e.id}`}
            className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-card transition-shadow hover:shadow-lg"
          >
            <div>
              <p className="font-medium">
                Admitted {new Date(e.admissionDate).toLocaleDateString()}
                {e.ward ? ` · ${e.ward}` : ""}
              </p>
              <p className="text-xs text-gray-500">
                {e.reports.length} report(s)
                {e.medicalDecision ? ` · medical: ${e.medicalDecision.medicalStatus.replaceAll("_", " ")}` : ""}
                {e.managementReview?.failureTag ? ` · blocked: ${e.managementReview.failureTag.replaceAll("_", " ")}` : ""}
                {e.dischargeDate ? ` · discharged ${new Date(e.dischargeDate).toLocaleDateString()}` : ""}
              </p>
            </div>
            <StatusBadge status={e.overallStatus} />
          </Link>
        ))}
      </div>
    </div>
  );
}
