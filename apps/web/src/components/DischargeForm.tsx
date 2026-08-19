import { useState } from "react";
import { MedicalStatus } from "@dfp/shared";
import { api } from "../api/client";

interface PrescriptionDraft {
  medicineName: string;
  dosage: string;
  frequency: string;
  durationDays: string;
  startDate: string;
  instructions: string;
}
interface AppointmentDraft {
  type: string;
  scheduledDate: string;
  provider: string;
}

const emptyRx = (): PrescriptionDraft => ({
  medicineName: "",
  dosage: "",
  frequency: "twice daily",
  durationDays: "5",
  startDate: new Date().toISOString().slice(0, 10),
  instructions: "",
});
const emptyAppt = (): AppointmentDraft => ({
  type: "",
  scheduledDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  provider: "",
});

interface ExistingDecision {
  medicalStatus: string;
  caregiverRequired: boolean;
  doctorNotes: string | null;
}

// The readiness control starts at `null` — never pre-filled from the AI
// summary shown above it on the dashboard — and submit is disabled until the
// doctor makes an explicit choice. See ARCHITECTURE.md section 2.3.
//
// `existingDecision` is different: it's the doctor's OWN prior submission
// (e.g. an earlier NOT_READY call), not an AI suggestion, so it's fine — and
// expected — to restore it here rather than resetting to a blank form.
export function DischargeForm({
  encounterId,
  existingDecision,
  onSubmitted,
}: {
  encounterId: string;
  existingDecision?: ExistingDecision | null;
  onSubmitted: () => void;
}) {
  const [medicalStatus, setMedicalStatus] = useState<string | null>(existingDecision?.medicalStatus ?? null);
  const [caregiverRequired, setCaregiverRequired] = useState(existingDecision?.caregiverRequired ?? false);
  const [doctorNotes, setDoctorNotes] = useState(existingDecision?.doctorNotes ?? "");
  const [prescriptions, setPrescriptions] = useState<PrescriptionDraft[]>([emptyRx()]);
  const [appointments, setAppointments] = useState<AppointmentDraft[]>([emptyAppt()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  async function submit() {
    if (!medicalStatus) return;
    setSubmitting(true);
    setError(null);
    setSavedAt(null);
    try {
      await api.post(`/api/encounters/${encounterId}/medical-decision`, {
        medicalStatus,
        caregiverRequired,
        doctorNotes: doctorNotes || undefined,
        prescriptions:
          medicalStatus === MedicalStatus.MEDICAL_READY
            ? prescriptions
                .filter((p) => p.medicineName)
                .map((p) => ({ ...p, durationDays: Number(p.durationDays) }))
            : [],
        appointments:
          medicalStatus === MedicalStatus.MEDICAL_READY ? appointments.filter((a) => a.type) : [],
      });
      setSavedAt(new Date());
      onSubmitted();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit decision");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-card p-4">
      <h3 className="font-display text-lg font-semibold">Medical discharge decision</h3>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => setMedicalStatus(MedicalStatus.MEDICAL_READY)}
          className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium ${
            medicalStatus === MedicalStatus.MEDICAL_READY
              ? "border-success bg-emerald-50 text-success"
              : "border-gray-300 text-gray-600"
          }`}
        >
          READY
        </button>
        <button
          type="button"
          onClick={() => setMedicalStatus(MedicalStatus.MEDICAL_NOT_READY)}
          className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium ${
            medicalStatus === MedicalStatus.MEDICAL_NOT_READY
              ? "border-critical bg-red-50 text-critical"
              : "border-gray-300 text-gray-600"
          }`}
        >
          NOT READY
        </button>
      </div>

      <label className="mt-3 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={caregiverRequired} onChange={(e) => setCaregiverRequired(e.target.checked)} />
        Caregiver required at home
      </label>

      <textarea
        className="mt-3 w-full rounded-md border border-gray-300 p-2 text-sm"
        placeholder="Doctor notes"
        rows={2}
        value={doctorNotes}
        onChange={(e) => setDoctorNotes(e.target.value)}
      />

      {medicalStatus === MedicalStatus.MEDICAL_READY && (
        <>
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-gray-700">Prescriptions</h4>
            {prescriptions.map((rx, i) => (
              <div key={i} className="mt-2 grid grid-cols-2 gap-2 rounded-md border border-gray-100 p-2 text-sm">
                <input
                  className="rounded border border-gray-300 p-1.5"
                  placeholder="Medicine name"
                  value={rx.medicineName}
                  onChange={(e) => updateRx(i, { medicineName: e.target.value })}
                />
                <input
                  className="rounded border border-gray-300 p-1.5"
                  placeholder="Dosage (e.g. 500mg)"
                  value={rx.dosage}
                  onChange={(e) => updateRx(i, { dosage: e.target.value })}
                />
                <select
                  className="rounded border border-gray-300 p-1.5"
                  value={rx.frequency}
                  onChange={(e) => updateRx(i, { frequency: e.target.value })}
                >
                  {["once daily", "twice daily", "three times daily", "four times daily"].map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </select>
                <input
                  className="rounded border border-gray-300 p-1.5"
                  type="number"
                  min={1}
                  placeholder="Duration (days)"
                  value={rx.durationDays}
                  onChange={(e) => updateRx(i, { durationDays: e.target.value })}
                />
                <input
                  className="rounded border border-gray-300 p-1.5"
                  type="date"
                  value={rx.startDate}
                  onChange={(e) => updateRx(i, { startDate: e.target.value })}
                />
                <input
                  className="rounded border border-gray-300 p-1.5"
                  placeholder="Instructions"
                  value={rx.instructions}
                  onChange={(e) => updateRx(i, { instructions: e.target.value })}
                />
              </div>
            ))}
            <button type="button" className="mt-2 text-xs text-accent-dark underline" onClick={() => setPrescriptions([...prescriptions, emptyRx()])}>
              + add another medicine
            </button>
          </div>

          <div className="mt-4">
            <h4 className="text-sm font-semibold text-gray-700">Follow-up appointments</h4>
            {appointments.map((appt, i) => (
              <div key={i} className="mt-2 grid grid-cols-3 gap-2 rounded-md border border-gray-100 p-2 text-sm">
                <input
                  className="rounded border border-gray-300 p-1.5"
                  placeholder="Type / department"
                  value={appt.type}
                  onChange={(e) => updateAppt(i, { type: e.target.value })}
                />
                <input
                  className="rounded border border-gray-300 p-1.5"
                  type="date"
                  value={appt.scheduledDate}
                  onChange={(e) => updateAppt(i, { scheduledDate: e.target.value })}
                />
                <input
                  className="rounded border border-gray-300 p-1.5"
                  placeholder="Provider"
                  value={appt.provider}
                  onChange={(e) => updateAppt(i, { provider: e.target.value })}
                />
              </div>
            ))}
            <button type="button" className="mt-2 text-xs text-accent-dark underline" onClick={() => setAppointments([...appointments, emptyAppt()])}>
              + add another appointment
            </button>
          </div>
        </>
      )}

      {error && <p className="mt-3 text-sm text-critical">{error}</p>}
      {savedAt && !error && (
        <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-success">
          ✓ Decision saved at {savedAt.toLocaleTimeString()}
          {medicalStatus === MedicalStatus.MEDICAL_NOT_READY && " — patient stays in your queue until you mark them ready."}
        </p>
      )}

      <button
        type="button"
        disabled={!medicalStatus || submitting}
        onClick={submit}
        className="mt-4 w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
      >
        {submitting ? "Submitting…" : existingDecision ? "Update medical decision" : "Submit medical decision"}
      </button>
    </div>
  );

  function updateRx(index: number, patch: Partial<PrescriptionDraft>) {
    setPrescriptions(prescriptions.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  }
  function updateAppt(index: number, patch: Partial<AppointmentDraft>) {
    setAppointments(appointments.map((a, i) => (i === index ? { ...a, ...patch } : a)));
  }
}
