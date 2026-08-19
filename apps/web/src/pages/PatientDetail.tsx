import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Role } from "@dfp/shared";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { StatusBadge } from "../components/StatusBadge";
import { ChevronLeftIcon } from "../components/Icons";
import { ReportCard } from "../components/ReportCard";
import { AISummaryPanel } from "../components/AISummaryPanel";
import { DischargeForm } from "../components/DischargeForm";
import { ManagementChecklistForm } from "../components/ManagementChecklistForm";
import { CarePlanView } from "../components/CarePlanView";
import { DischargeBlockerPanel } from "../components/DischargeBlockerPanel";
import { HistoryComparisonPanel } from "../components/HistoryComparisonPanel";
import { CaregiverMatchPanel } from "../components/CaregiverMatchPanel";
import { AuditTrailPanel } from "../components/AuditTrailPanel";

interface EncounterDetail {
  id: string;
  overallStatus: string;
  failureStage: string | null;
  failureTag: string | null;
  admissionDate: string;
  dischargeDate: string | null;
  ward: string | null;
  patient: { id: string; name: string; dob: string; gender: string; contactPhone: string | null };
  reports: { id: string; type: string; originalFilename: string; status: string; createdAt: string }[];
  aiAnalyses: { reportId: string | null; scope: string; summaryText: string; findingsJson: string; plainLanguageExplanation: string; modelUsed: string }[];
  medicalDecision: { medicalStatus: string; caregiverRequired: boolean; doctorNotes: string | null } | null;
  prescriptions: { medicineName: string; dosage: string; frequency: string; durationDays: number; startDate: string; instructions: string | null }[];
  appointments: { type: string; scheduledDate: string; provider: string | null }[];
  managementReview: { managementStatus: string; failureTag: string | null } | null;
  carePlan: { items: { id: string; itemType: string; description: string; scheduledAt: string; reminders: { status: string }[] }[] } | null;
  riskIndicator: { riskScore: number; band: string; modelVersion: string };
  dischargeBlockers: any;
  historicalChanges: any;
  caregiverMatch: any;
}

const REPORT_TYPES = ["BLOOD", "DIAGNOSTIC", "CLINICAL_NOTE", "MEDICATION", "OTHER"];

export function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [encounter, setEncounter] = useState<EncounterDetail | null>(null);

  const load = useCallback(() => {
    if (!id) return;
    api.get<EncounterDetail>(`/api/encounters/${id}`).then(setEncounter);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Poll while any report is still being analyzed, or while a care plan is
  // still being generated after approval — both happen off the request path
  // in the job worker, so the UI has to catch up rather than assume "done".
  useEffect(() => {
    if (!encounter) return;
    const reportsPending = encounter.reports.some((r) => r.status === "UPLOADED" || r.status === "PROCESSING");
    const carePlanPending = encounter.overallStatus === "DISCHARGE_APPROVED" && !encounter.carePlan;
    if (!reportsPending && !carePlanPending) return;
    const t = setInterval(load, 1500);
    return () => clearInterval(t);
  }, [encounter, load]);

  if (!encounter) return <p className="text-sm text-gray-500">Loading…</p>;

  const overallAnalysis = encounter.aiAnalyses.find((a) => a.scope === "OVERALL");
  const analysisByReportId = new Map(encounter.aiAnalyses.filter((a) => a.scope === "PER_REPORT").map((a) => [a.reportId, a]));

  const backTo = user?.role === Role.MANAGEMENT ? "/management" : "/doctor";

  return (
    <div>
      <Link to={backTo} className="mb-4 inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-accent-dark">
        <ChevronLeftIcon className="h-3.5 w-3.5" />
        Back to queue
      </Link>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">{encounter.patient.name}</h1>
          <p className="text-sm text-gray-500">
            {encounter.patient.gender} · DOB {new Date(encounter.patient.dob).toLocaleDateString()} · Ward: {encounter.ward ?? "—"}
          </p>
          <Link to={`/patients/${encounter.patient.id}/history`} className="text-xs font-medium text-accent-dark hover:underline">
            View full visit history →
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <RiskBadge risk={encounter.riskIndicator} />
          <StatusBadge status={encounter.overallStatus} />
        </div>
      </div>

      <div className="mt-4">
        <DischargeBlockerPanel report={encounter.dischargeBlockers} />
      </div>

      <div className="mt-6">
        <AISummaryPanel analysis={overallAnalysis} title="Overall AI summary (all reports)" doctorReviewed={!!encounter.medicalDecision} />
      </div>

      <div className="mt-6">
        <HistoryComparisonPanel comparison={encounter.historicalChanges} />
      </div>

      <div className="mt-6">
        <h2 className="font-display text-lg font-semibold">Reports</h2>
        <div className="mt-2 space-y-3">
          {encounter.reports.map((r) => (
            <ReportCard key={r.id} report={r} analysis={analysisByReportId.get(r.id) as any} />
          ))}
        </div>

        {user?.role === Role.DOCTOR && encounter.overallStatus === "IN_PROGRESS" && (
          <UploadReportForm encounterId={encounter.id} onUploaded={load} />
        )}
      </div>

      {user?.role === Role.DOCTOR && encounter.overallStatus === "IN_PROGRESS" && (
        <div className="mt-6">
          <DischargeForm encounterId={encounter.id} existingDecision={encounter.medicalDecision} onSubmitted={load} />
        </div>
      )}

      {user?.role === Role.MANAGEMENT && encounter.caregiverMatch && (
        <div className="mt-6">
          <CaregiverMatchPanel match={encounter.caregiverMatch} />
        </div>
      )}

      {user?.role === Role.MANAGEMENT && encounter.overallStatus === "MANAGEMENT_REVIEW" && (
        <div className="mt-6">
          <ManagementChecklistForm
            encounterId={encounter.id}
            caregiverRequired={encounter.medicalDecision?.caregiverRequired ?? false}
            onSubmitted={load}
          />
        </div>
      )}

      {encounter.carePlan && (
        <div className="mt-6">
          <CarePlanView items={encounter.carePlan.items} />
        </div>
      )}

      <div className="mt-6">
        <AuditTrailPanel encounterId={encounter.id} />
      </div>
    </div>
  );
}

function RiskBadge({ risk }: { risk: { riskScore: number; band: string } }) {
  const color = risk.band === "HIGH" ? "text-critical" : risk.band === "MODERATE" ? "text-warn" : "text-success";
  return (
    <span className={`rounded-full border border-gray-200 px-2.5 py-0.5 font-mono text-xs ${color}`} title="Advisory only — never gates the workflow">
      risk: {Math.round(risk.riskScore * 100)}% ({risk.band})
    </span>
  );
}

function UploadReportForm({ encounterId, onUploaded }: { encounterId: string; onUploaded: () => void }) {
  const [type, setType] = useState("BLOOD");
  const [textContent, setTextContent] = useState("");
  const [labTest, setLabTest] = useState("");
  const [labValue, setLabValue] = useState("");
  const [labUnit, setLabUnit] = useState("");
  const [structuredValues, setStructuredValues] = useState<{ test: string; value: number; unit: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  function addLabValue() {
    if (!labTest || !labValue) return;
    setStructuredValues([...structuredValues, { test: labTest, value: Number(labValue), unit: labUnit }]);
    setLabTest("");
    setLabValue("");
    setLabUnit("");
  }

  async function submit() {
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("encounterId", encounterId);
      form.append("type", type);
      if (textContent) form.append("textContent", textContent);
      if (structuredValues.length) form.append("structuredValues", JSON.stringify(structuredValues));
      await api.post("/api/reports", form);
      setTextContent("");
      setStructuredValues([]);
      onUploaded();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-3 rounded-lg border border-dashed border-gray-300 p-4">
      <h4 className="text-sm font-semibold text-gray-700">Add a report</h4>
      <select className="mt-2 rounded-md border border-gray-300 p-2 text-sm" value={type} onChange={(e) => setType(e.target.value)}>
        {REPORT_TYPES.map((t) => (
          <option key={t}>{t}</option>
        ))}
      </select>

      <textarea
        className="mt-2 w-full rounded-md border border-gray-300 p-2 text-sm"
        placeholder="Report text / clinical note content (optional)"
        rows={2}
        value={textContent}
        onChange={(e) => setTextContent(e.target.value)}
      />

      {type === "BLOOD" && (
        <div className="mt-2">
          <div className="flex gap-2">
            <input className="w-32 rounded border border-gray-300 p-1.5 text-sm" placeholder="Test (e.g. Hemoglobin)" value={labTest} onChange={(e) => setLabTest(e.target.value)} />
            <input className="w-20 rounded border border-gray-300 p-1.5 text-sm" placeholder="Value" value={labValue} onChange={(e) => setLabValue(e.target.value)} />
            <input className="w-20 rounded border border-gray-300 p-1.5 text-sm" placeholder="Unit" value={labUnit} onChange={(e) => setLabUnit(e.target.value)} />
            <button type="button" onClick={addLabValue} className="rounded border border-gray-300 px-2 text-sm">
              add
            </button>
          </div>
          {structuredValues.length > 0 && (
            <ul className="mt-1 font-mono text-xs text-gray-500">
              {structuredValues.map((v, i) => (
                <li key={i}>
                  {v.test}: {v.value} {v.unit}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <button
        type="button"
        disabled={submitting}
        onClick={submit}
        className="mt-3 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
      >
        {submitting ? "Uploading…" : "Upload report"}
      </button>
    </div>
  );
}
