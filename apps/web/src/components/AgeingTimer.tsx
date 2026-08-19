function format(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${String(hours).padStart(2, "0")}h`;
  return `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m`;
}

// Three ageing tiers, not a gradient — a coordinator needs a decision
// boundary to triage by, not a continuous scale. Thresholds are placeholders
// (PRD §13.1 flags real discharge-delay data as still needed).
const FRESH_MS = 12 * 60 * 60 * 1000;
const STALE_MS = 36 * 60 * 60 * 1000;

export function ageingTier(ms: number): "fresh" | "ageing" | "stale" {
  if (ms > STALE_MS) return "stale";
  if (ms > FRESH_MS) return "ageing";
  return "fresh";
}

const TIER_CLASS: Record<ReturnType<typeof ageingTier>, string> = {
  fresh: "text-gray-500",
  ageing: "text-warn font-semibold",
  stale: "text-critical font-semibold",
};

export function AgeingTimer({ ms }: { ms: number }) {
  const tier = ageingTier(ms);
  const totalHours = Math.floor(ms / 3600000);
  return (
    <span className={`font-mono text-[13px] tabular-nums ${TIER_CLASS[tier]}`} aria-label={`blocked for ${totalHours} hours`}>
      {format(ms)}
    </span>
  );
}
