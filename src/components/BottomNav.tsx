"use client";

export type TabId = "home" | "timeline" | "charts" | "more";

const tabs: { id: TabId; label: string; icon: string }[] = [
  { id: "home", label: "Home", icon: "⌂" },
  { id: "timeline", label: "Timeline", icon: "☰" },
  { id: "charts", label: "Charts", icon: "◔" },
  { id: "more", label: "More", icon: "···" },
];

export function BottomNav({
  tab,
  onChange,
}: {
  tab: TabId;
  onChange: (tab: TabId) => void;
}) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-white/85 backdrop-blur-xl">
      <div className="mx-auto grid max-w-md grid-cols-4 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.id)}
              className={`flex flex-col items-center gap-1 rounded-2xl py-2 text-xs font-semibold transition ${
                active ? "text-[var(--accent)]" : "text-[var(--muted)]"
              }`}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-base ${
                  active ? "bg-[var(--accent-soft)]" : "bg-transparent"
                }`}
              >
                {t.icon}
              </span>
              {t.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
