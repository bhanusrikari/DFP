type ChecklistState = "SATISFIED" | "OUTSTANDING" | "IN_PROGRESS" | "NOT_REQUIRED";

const DOT_STYLES: Record<ChecklistState, string> = {
  SATISFIED: "bg-success text-white",
  OUTSTANDING: "bg-critical text-white",
  IN_PROGRESS: "bg-warn text-white",
  NOT_REQUIRED: "bg-neutral-soft text-neutral",
};

const LABELS: Record<ChecklistState, string> = {
  SATISFIED: "satisfied",
  OUTSTANDING: "outstanding",
  IN_PROGRESS: "in progress",
  NOT_REQUIRED: "not required",
};

interface Checklist {
  caregiver: ChecklistState;
  insurance: ChecklistState;
  billing: ChecklistState;
  documents: ChecklistState;
}

const ITEMS: { key: keyof Checklist; letter: string; name: string }[] = [
  { key: "caregiver", letter: "C", name: "Caregiver" },
  { key: "insurance", letter: "I", name: "Insurance" },
  { key: "billing", letter: "B", name: "Billing" },
  { key: "documents", letter: "D", name: "Documents" },
];

// Four-dot compact device — REQ-7.5.1: shows what's already satisfied
// alongside what's blocking, scannable down a whole table without reading
// a word. Tooltip + aria-label carry the full text for anyone who needs it.
export function ChecklistCluster({ checklist }: { checklist: Checklist }) {
  const ariaLabel = ITEMS.map((i) => `${i.name} ${LABELS[checklist[i.key]]}`).join(", ");

  return (
    <div className="flex items-center gap-1" role="group" aria-label={ariaLabel} title={ariaLabel}>
      {ITEMS.map((item) => (
        <span
          key={item.key}
          className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold ${DOT_STYLES[checklist[item.key]]}`}
        >
          {item.letter}
        </span>
      ))}
    </div>
  );
}
