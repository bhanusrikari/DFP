import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

interface CreatedPatient {
  id: string;
}
interface CreatedEncounter {
  id: string;
}

// Wires up POST /api/patients + POST /api/patients/:id/encounters — both
// existed on the backend with no frontend caller before this.
export function AddPatientModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("Female");
  const [contactPhone, setContactPhone] = useState("");
  const [ward, setWard] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!name || !dob) {
      setError("Name and date of birth are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const patient = await api.post<CreatedPatient>("/api/patients", { name, dob, gender, contactPhone: contactPhone || undefined });
      const encounter = await api.post<CreatedEncounter>(`/api/patients/${patient.id}/encounters`, { ward: ward || undefined });
      onClose();
      navigate(`/patients/${encounter.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create patient");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-6 shadow-card" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-lg font-bold">Admit new patient</h2>
        <p className="mt-1 text-xs text-gray-500">Creates the patient record and opens their first encounter.</p>

        <div className="mt-4 space-y-3">
          <input
            className="w-full rounded-lg border border-gray-300 p-2 text-sm"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              className="w-full rounded-lg border border-gray-300 p-2 text-sm"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />
            <select className="w-full rounded-lg border border-gray-300 p-2 text-sm" value={gender} onChange={(e) => setGender(e.target.value)}>
              <option>Female</option>
              <option>Male</option>
              <option>Other</option>
            </select>
          </div>
          <input
            className="w-full rounded-lg border border-gray-300 p-2 text-sm"
            placeholder="Contact phone (for WhatsApp reminders)"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
          />
          <input
            className="w-full rounded-lg border border-gray-300 p-2 text-sm"
            placeholder="Ward (optional)"
            value={ward}
            onChange={(e) => setWard(e.target.value)}
          />
        </div>

        {error && <p className="mt-3 text-sm text-critical">{error}</p>}

        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600">
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={submit}
            className="flex-1 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            {submitting ? "Creating…" : "Admit patient"}
          </button>
        </div>
      </div>
    </div>
  );
}
