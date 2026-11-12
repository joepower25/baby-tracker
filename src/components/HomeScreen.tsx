"use client";

import { BrandMark, Button, EmptyState } from "@/components/ui";
import type { LogKind } from "@/components/LogSheets";
import type { Baby } from "@/lib/types";

type HomeData = {
  baby: Baby;
  status: {
    lastFeed: {
      type: string;
      amount: number | null;
      unit: string | null;
      side: string | null;
      ago: string;
    } | null;
    lastDiaper: {
      kind: string;
      ago: string;
      hoursSince: number;
    } | null;
    sleep: {
      asleep: boolean;
      durationHours: number;
      ago: string;
    } | null;
  };
};

const actions: { id: LogKind; label: string; tone: string }[] = [
  { id: "feed", label: "Feed", tone: "bg-[#dff0eb] text-[#2f6f64]" },
  { id: "diaper", label: "Diaper", tone: "bg-[#e4ebf4] text-[#4d6280]" },
  { id: "sleep", label: "Sleep", tone: "bg-[#ebe7f4] text-[#5a4f7a]" },
  { id: "pump", label: "Pump", tone: "bg-[#f3e8dc] text-[#7a5a3e]" },
  { id: "med", label: "Med", tone: "bg-[#f3e4e4] text-[#7a4848]" },
  { id: "growth", label: "Weight", tone: "bg-[#e7f0df] text-[#4f6a3f]" },
];

export function HomeScreen({
  data,
  onLog,
  onEndSleep,
  endingSleep,
}: {
  data: HomeData;
  onLog: (kind: Exclude<LogKind, null>) => void;
  onEndSleep: () => void;
  endingSleep: boolean;
}) {
  const { baby, status } = data;
  const asleep = status.sleep?.asleep;

  return (
    <div className="space-y-5">
      <BrandMark subtitle="Quick log · shared with caregivers" />
      <section className="glass animate-rise rounded-[1.5rem] p-5">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
          Now
        </p>
        <h1 className="mt-1 text-4xl font-semibold text-[var(--ink)]">
          {baby.name}
        </h1>
        <div className="mt-4 grid gap-3">
          <StatusLine
            label="Last feed"
            value={
              status.lastFeed
                ? `${status.lastFeed.type}${
                    status.lastFeed.amount != null
                      ? ` · ${status.lastFeed.amount}${status.lastFeed.unit || ""}`
                      : status.lastFeed.side
                        ? ` · ${status.lastFeed.side}`
                        : ""
                  } · ${status.lastFeed.ago}`
                : "No feeds yet"
            }
          />
          <StatusLine
            label="Last diaper"
            value={
              status.lastDiaper
                ? `${status.lastDiaper.kind} · ${status.lastDiaper.ago}`
                : "No diapers yet"
            }
          />
          <div
            className={`rounded-2xl px-4 py-3 ${
              asleep ? "bg-[var(--accent-soft)] sleep-pulse" : "bg-white/70"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
              Sleep
            </p>
            <p className="mt-1 text-base font-semibold text-[var(--ink)]">
              {status.sleep
                ? asleep
                  ? `Asleep · ${status.sleep.durationHours.toFixed(1)}h so far`
                  : `Awake · last sleep ${status.sleep.ago}`
                : "No sleep logged"}
            </p>
            {asleep ? (
              <Button
                className="mt-3 w-full"
                onClick={onEndSleep}
                disabled={endingSleep}
              >
                {endingSleep ? "Ending…" : "End sleep"}
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="animate-rise" style={{ animationDelay: "80ms" }}>
        <p className="mb-3 text-sm font-semibold text-[var(--ink-soft)]">
          Quick actions
        </p>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => (
            <button
              key={action.id!}
              type="button"
              onClick={() => onLog(action.id!)}
              className={`tap rounded-[1.35rem] px-4 text-left text-lg font-bold shadow-sm transition active:scale-[0.98] ${action.tone}`}
            >
              {action.label}
            </button>
          ))}
        </div>
      </section>

      {!status.lastFeed && !status.lastDiaper && !status.sleep ? (
        <EmptyState
          title="Ready when you are"
          body="Tap Feed, Diaper, or Sleep to start the shared log."
        />
      ) : null}
    </div>
  );
}

function StatusLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/70 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-1 text-base font-semibold text-[var(--ink)]">{value}</p>
    </div>
  );
}
