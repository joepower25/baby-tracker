"use client";

import { Chip, EmptyState, SectionTitle } from "@/components/ui";
import type { TimelineEvent, TimelineEventType } from "@/lib/types";

const filters: { id: "all" | TimelineEventType; label: string }[] = [
  { id: "all", label: "All" },
  { id: "feeding", label: "Feed" },
  { id: "diaper", label: "Diaper" },
  { id: "sleep", label: "Sleep" },
  { id: "pumping", label: "Pump" },
  { id: "medication", label: "Med" },
  { id: "growth", label: "Growth" },
];

const tone: Record<TimelineEventType, string> = {
  feeding: "bg-[#dff0eb] text-[#2f6f64]",
  diaper: "bg-[#e4ebf4] text-[#4d6280]",
  sleep: "bg-[#ebe7f4] text-[#5a4f7a]",
  pumping: "bg-[#f3e8dc] text-[#7a5a3e]",
  medication: "bg-[#f3e4e4] text-[#7a4848]",
  growth: "bg-[#e7f0df] text-[#4f6a3f]",
};

export function TimelineScreen({
  events,
  filter,
  onFilter,
  onEdit,
}: {
  events: TimelineEvent[];
  filter: "all" | TimelineEventType;
  onFilter: (f: "all" | TimelineEventType) => void;
  onEdit: (event: TimelineEvent) => void;
}) {
  return (
    <div className="space-y-4">
      <SectionTitle
        title="Timeline"
        subtitle="Tap any entry to edit or delete."
      />
      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((f) => (
          <Chip
            key={f.id}
            active={filter === f.id}
            onClick={() => onFilter(f.id)}
          >
            {f.label}
          </Chip>
        ))}
      </div>
      {events.length === 0 ? (
        <EmptyState
          title="Nothing here yet"
          body="Logged events show up in reverse chronological order."
        />
      ) : (
        <ul className="space-y-3">
          {events.map((event, i) => (
            <li key={`${event.type}-${event.id}`}>
              <button
                type="button"
                onClick={() => onEdit(event)}
                className="glass animate-rise w-full rounded-[1.25rem] px-4 py-3 text-left transition active:scale-[0.99]"
                style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${tone[event.type]}`}
                    >
                      {event.type}
                    </span>
                    <p className="mt-2 text-base font-semibold text-[var(--ink)]">
                      {event.title}
                    </p>
                    <p className="mt-0.5 text-sm text-[var(--muted)]">
                      {event.detail}
                    </p>
                  </div>
                  <span className="text-sm text-[var(--muted)]">Edit</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
