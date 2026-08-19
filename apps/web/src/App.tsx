import { useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Role } from "@dfp/shared";
import { useAuth } from "./auth/AuthContext";
import { api } from "./api/client";
import { LoginPage } from "./pages/LoginPage";
import { DoctorDashboard } from "./pages/DoctorDashboard";
import { ManagementDashboard } from "./pages/ManagementDashboard";
import { PatientDetail } from "./pages/PatientDetail";
import { PatientHistoryPage } from "./pages/PatientHistoryPage";
import { StethoscopeIcon, BuildingIcon, HistoryIcon, LogoutIcon } from "./components/Icons";

function NavIcon({
  to,
  label,
  active,
  onClick,
  children,
}: {
  to: string;
  label: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      onClick={onClick}
      className={`group relative flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${
        active ? "bg-accent text-white" : "text-gray-400 hover:bg-white/10 hover:text-white"
      }`}
    >
      {children}
      <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-xs font-medium text-white opacity-0 shadow-card transition-opacity group-hover:opacity-100">
        {label}
      </span>
    </button>
  );
}

function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [seeding, setSeeding] = useState(false);

  async function reseed() {
    if (seeding) return;
    const confirmed = window.confirm(
      "Reset demo data? This wipes everything and rebuilds a fresh set: 3 patients in the doctor queue, 2 in management. You'll need to sign back in."
    );
    if (!confirmed) return;
    setSeeding(true);
    try {
      await api.post("/api/dev/reseed");
      logout();
      navigate("/login");
    } catch {
      window.alert("Reseed failed — check the API server is running.");
    } finally {
      setSeeding(false);
    }
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex w-20 flex-col items-center gap-2 bg-sidebar py-6">
      <div className="mb-6 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-lavender-ink text-sm font-display font-extrabold text-white">
        DP
      </div>

      <nav className="flex flex-1 flex-col items-center gap-2">
        <NavIcon to="/doctor" label="Doctor queue" active={location.pathname === "/doctor"} onClick={() => navigate("/doctor")}>
          <StethoscopeIcon className="h-5 w-5" />
        </NavIcon>
        <NavIcon
          to="/management"
          label="Management queue"
          active={location.pathname === "/management"}
          onClick={() => navigate("/management")}
        >
          <BuildingIcon className="h-5 w-5" />
        </NavIcon>
      </nav>

      <div className="flex flex-col items-center gap-3 pt-4">
        <NavIcon to="#" label={seeding ? "Resetting…" : "Reset demo data"} active={false} onClick={reseed}>
          <HistoryIcon className={`h-5 w-5 ${seeding ? "animate-spin" : ""}`} />
        </NavIcon>
        {user && (
          <div
            title={`${user.name} · ${user.role}`}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 font-display text-xs font-bold text-white"
          >
            {user.name
              .split(" ")
              .map((p) => p[0])
              .slice(0, 2)
              .join("")}
          </div>
        )}
        <NavIcon
          to="/login"
          label="Sign out"
          active={false}
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          <LogoutIcon className="h-5 w-5" />
        </NavIcon>
      </div>
    </aside>
  );
}

function TopBar() {
  const { user } = useAuth();
  return (
    <div className="mb-8 flex items-center justify-between">
      <div className="font-mono text-xs uppercase tracking-wide text-accent-dark">Discharge Readiness Planner</div>
      {user && (
        <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white py-1.5 pl-1.5 pr-4 shadow-card">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft font-display text-[11px] font-bold text-accent-dark">
            {user.name
              .split(" ")
              .map((p) => p[0])
              .slice(0, 2)
              .join("")}
          </div>
          <span className="text-sm font-medium text-ink">{user.name}</span>
          <span className="font-mono text-[10px] uppercase tracking-wide text-gray-400">{user.role}</span>
        </div>
      )}
    </div>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper">
      <Sidebar />
      <main className="ml-20 px-8 py-8 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <TopBar />
          {children}
        </div>
      </main>
    </div>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="p-8 text-sm text-gray-500">Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

function HomeRedirect() {
  const { user } = useAuth();
  if (user?.role === Role.MANAGEMENT) return <Navigate to="/management" replace />;
  return <Navigate to="/doctor" replace />;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <HomeRedirect />
          </RequireAuth>
        }
      />
      <Route
        path="/doctor"
        element={
          <RequireAuth>
            <DoctorDashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/management"
        element={
          <RequireAuth>
            <ManagementDashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/patients/:patientId/history"
        element={
          <RequireAuth>
            <PatientHistoryPage />
          </RequireAuth>
        }
      />
      <Route
        path="/patients/:id"
        element={
          <RequireAuth>
            <PatientDetail />
          </RequireAuth>
        }
      />
    </Routes>
  );
}
