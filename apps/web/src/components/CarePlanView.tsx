import { StatusBadge } from "./StatusBadge";

interface ReminderLike {
  status: string;
}
interface ItemLike {
  id: string;
  itemType: string;
  description: string;
  scheduledAt: string;
  reminders: ReminderLike[];
}

// Renders as a dated timeline — deliberately mirrors the PRD's own example
// (19 Aug Discharge / 20 Aug medicine / 25 Aug follow-up / 26 Aug course
// complete), since that grouping is what a patient/caregiver actually reads.
export function CarePlanView({ items }: { items: ItemLike[] }) {
  const byDate = new Map<string, ItemLike[]>();
  for (const item of items) {
    const dateKey = new Date(item.scheduledAt).toLocaleDateString(undefined, { day: "2-digit", month: "short" });
    if (!byDate.has(dateKey)) byDate.set(dateKey, []);
    byDate.get(dateKey)!.push(item);
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-card p-4">
      <h3 className="font-display text-lg font-semibold">Care plan</h3>
      <div className="mt-3 space-y-4">
        {[...byDate.entries()].map(([date, dateItems]) => (
          <div key={date} className="flex gap-4">
            <div className="w-16 shrink-0 font-mono text-sm text-accent-dark">{date}</div>
            <div className="flex-1 space-y-1.5 border-l border-gray-200 pl-4">
              {dateItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span>
                    <span className="text-gray-400">
                      {new Date(item.scheduledAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                    </span>{" "}
                    {item.description}
                  </span>
                  {item.reminders[0] && <StatusBadge status={item.reminders[0].status} />}
                </div>
              ))}
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-gray-500">Care plan will appear once discharge is approved.</p>}
      </div>
    </div>
  );
}
