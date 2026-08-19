import { useState } from "react";
import { FailureTag, ManagementStatus } from "@dfp/shared";
import { api } from "../api/client";

const FAILURE_TAGS = [
  FailureTag.CAREGIVER_UNAVAILABLE,
  FailureTag.INSURANCE_PENDING,
  FailureTag.BILLING_PENDING,
  FailureTag.DOCUMENTS_INCOMPLETE,
  FailureTag.APPOINTMENT_NOT_SCHEDULED,
  FailureTag.OTHER_ADMINISTRATIVE_ISSUE,
];

export function ManagementChecklistForm({
  encounterId,
  caregiverRequired,
  onSubmitted,
}: {
  encounterId: string;
  caregiverRequired: boolean;
  onSubmitted: () => void;
}) {
  const [caregiverAvailable, setCaregiverAvailable] = useState(true);
  const [insuranceStatus, setInsuranceStatus] = useState("PENDING");
  const [billingStatus, setBillingStatus] = useState("PENDING");
  const [documentsStatus, setDocumentsStatus] = useState("INCOMPLETE");
  const [otherNotes, setOtherNotes] = useState("");
  const [failureTag, setFailureTag] = useState<string>(FailureTag.OTHER_ADMINISTRATIVE_ISSUE);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(managementStatus: string) {
    setSubmitting(true);
    setError(null);
    try {
      await api.post(`/api/encounters/${encounterId}/management-review`, {
        caregiverAvailable: caregiverRequired ? caregiverAvailable : undefined,
        insuranceStatus,
        billingStatus,
        documentsStatus,
        otherNotes: otherNotes || undefined,
        managementStatus,
        failureTag: managementStatus === ManagementStatus.FAILED ? failureTag : undefined,
      });
      onSubmitted();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  }

  const allClear =
    insuranceStatus === "CLEARED" &&
    billingStatus === "CLEARED" &&
    documentsStatus === "COMPLETE" &&
    (!caregiverRequired || caregiverAvailable);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-card p-4">
      <h3 className="font-display text-lg font-semibold">Operational discharge checklist</h3>

      {caregiverRequired && (
        <ChecklistRow label="Caregiver available">
          <ToggleSelect value={caregiverAvailable ? "YES" : "NO"} options={["YES", "NO"]} onChange={(v) => setCaregiverAvailable(v === "YES")} />
        </ChecklistRow>
      )}
      <ChecklistRow label="Insurance status">
        <ToggleSelect value={insuranceStatus} options={["CLEARED", "PENDING"]} onChange={setInsuranceStatus} />
      </ChecklistRow>
      <ChecklistRow label="Billing status">
        <ToggleSelect value={billingStatus} options={["CLEARED", "PENDING"]} onChange={setBillingStatus} />
      </ChecklistRow>
      <ChecklistRow label="Documents">
        <ToggleSelect value={documentsStatus} options={["COMPLETE", "INCOMPLETE"]} onChange={setDocumentsStatus} />
      </ChecklistRow>

      <textarea
        className="mt-3 w-full rounded-md border border-gray-300 p-2 text-sm"
        placeholder="Notes"
        rows={2}
        value={otherNotes}
        onChange={(e) => setOtherNotes(e.target.value)}
      />

      {!allClear && (
        <div className="mt-3">
          <label className="text-xs font-mono uppercase tracking-wide text-gray-500">If failing, reason</label>
          <select
            className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm"
            value={failureTag}
            onChange={(e) => setFailureTag(e.target.value)}
          >
            {FAILURE_TAGS.map((t) => (
              <option key={t} value={t}>
                {t.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-critical">{error}</p>}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          disabled={submitting}
          onClick={() => submit(ManagementStatus.PENDING)}
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 disabled:opacity-40"
        >
          Save progress
        </button>
        <button
          type="button"
          disabled={submitting || !allClear}
          onClick={() => submit(ManagementStatus.APPROVED)}
          className="flex-1 rounded-md bg-success px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          Approve discharge
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={() => submit(ManagementStatus.FAILED)}
          className="flex-1 rounded-md bg-critical px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          Fail discharge
        </button>
      </div>
    </div>
  );
}

function ChecklistRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-2 flex items-center justify-between text-sm">
      <span className="text-gray-600">{label}</span>
      {children}
    </div>
  );
}

function ToggleSelect({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="flex overflow-hidden rounded-md border border-gray-300">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-2.5 py-1 font-mono text-xs ${value === opt ? "bg-accent text-white" : "bg-white text-gray-600"}`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
