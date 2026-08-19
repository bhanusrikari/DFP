import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const DEMO_ACCOUNTS = [
  { label: "Doctor — Dr. Asha Rao", email: "doctor@demo.com", password: "password123" },
  { label: "Management — Vikram Shah", email: "management@demo.com", password: "password123" },
];

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("doctor@demo.com");
  const [password, setPassword] = useState("password123");
  const [demoChoice, setDemoChoice] = useState("doctor@demo.com");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function selectDemoAccount(accountEmail: string) {
    const account = DEMO_ACCOUNTS.find((a) => a.email === accountEmail);
    setDemoChoice(accountEmail);
    if (account) {
      setEmail(account.email);
      setPassword(account.password);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
      navigate("/");
    } catch {
      setError("Invalid email or password");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-8 shadow-card">
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-lavender-ink font-display text-sm font-extrabold text-white">
          DP
        </div>
        <div className="font-mono text-xs uppercase tracking-wide text-accent">Discharge Readiness Planner</div>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight">Sign in</h1>

        <div className="mt-6">
          <label htmlFor="demoAccount" className="text-xs text-gray-500">
            Quick fill a demo account
          </label>
          <select
            id="demoAccount"
            value={demoChoice}
            onChange={(e) => selectDemoAccount(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2 font-mono text-sm text-accent-dark"
          >
            {DEMO_ACCOUNTS.map((a) => (
              <option key={a.email} value={a.email}>
                {a.label} · {a.email}
              </option>
            ))}
          </select>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label htmlFor="email" className="text-xs text-gray-500">
              Email
            </label>
            <input
              id="email"
              className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="text-xs text-gray-500">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-critical">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
