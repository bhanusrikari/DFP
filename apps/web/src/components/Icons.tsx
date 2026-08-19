// Small hand-authored icon set (stroke = currentColor) so the app has no
// external icon-font/asset dependency. Keep new icons to this same 24x24,
// stroke-1.75 style so they read as one system.
type IconProps = { className?: string };
const base = "stroke-current fill-none";

export function StethoscopeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path className={base} d="M5 3v6a4 4 0 0 0 8 0V3" />
      <path className={base} d="M9 13v2a5 5 0 0 0 10 0v-2.5" />
      <circle className={base} cx="19" cy="9.5" r="1.75" />
    </svg>
  );
}

export function BuildingIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <rect className={base} x="4" y="3" width="12" height="18" />
      <path className={base} d="M16 21h4V9l-4-2" />
      <path className={base} d="M8 7h.01M12 7h.01M8 11h.01M12 11h.01M8 15h.01M12 15h.01" />
    </svg>
  );
}

export function UsersIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <circle className={base} cx="9" cy="8" r="3" />
      <path className={base} d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <path className={base} d="M16 5.2a3 3 0 0 1 0 5.6M21 20c0-2.8-2-5.1-4.7-5.8" />
    </svg>
  );
}

export function PlusIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path className={base} d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function SearchIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <circle className={base} cx="11" cy="11" r="7" />
      <path className={base} d="M21 21l-4.3-4.3" />
    </svg>
  );
}

export function ChevronLeftIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path className={base} d="M15 18l-6-6 6-6" />
    </svg>
  );
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path className={base} d="M9 18l6-6-6-6" />
    </svg>
  );
}

export function CheckCircleIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <circle className={base} cx="12" cy="12" r="9" />
      <path className={base} d="M8.5 12.5l2.5 2.5 5-5.5" />
    </svg>
  );
}

export function XCircleIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <circle className={base} cx="12" cy="12" r="9" />
      <path className={base} d="M9.5 9.5l5 5M14.5 9.5l-5 5" />
    </svg>
  );
}

export function ClockIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <circle className={base} cx="12" cy="12" r="9" />
      <path className={base} d="M12 7v5l3.5 2" />
    </svg>
  );
}

export function AlertTriangleIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path className={base} d="M12 3.5l9.5 16.5H2.5L12 3.5z" />
      <path className={base} d="M12 10v4.5M12 17.2h.01" />
    </svg>
  );
}

export function FileTextIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path className={base} d="M7 3h7l5 5v13H7z" />
      <path className={base} d="M14 3v5h5M9 12h6M9 16h6" />
    </svg>
  );
}

export function PillIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <rect className={base} x="3.5" y="9.5" width="17" height="7" rx="3.5" transform="rotate(-35 12 12)" />
      <path className={base} d="M11 8.3l3.6 6.6" />
    </svg>
  );
}

export function CalendarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <rect className={base} x="3.5" y="5" width="17" height="16" rx="2" />
      <path className={base} d="M3.5 10h17M8 3v4M16 3v4" />
    </svg>
  );
}

export function HistoryIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path className={base} d="M3 12a9 9 0 1 0 3-6.7" />
      <path className={base} d="M3 4v4h4M12 8v4l3 2" />
    </svg>
  );
}

export function LogoutIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path className={base} d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path className={base} d="M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}

export function ShieldIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path className={base} d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
      <path className={base} d="M9.5 12l1.8 1.8L14.5 10" />
    </svg>
  );
}
