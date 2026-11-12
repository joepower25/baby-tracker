import { formatLocal, minutesBetween } from "./format";
import type {
  Diaper,
  Feeding,
  Growth,
  Medication,
  Pumping,
  Sleep,
  TimelineEvent,
} from "./types";

export function feedingTitle(f: Feeding): string {
  if (f.type === "breast") {
    const side =
      f.side === "left" ? "left" : f.side === "right" ? "right" : "both sides";
    const mins = f.ended_at
      ? Math.round(minutesBetween(f.started_at, f.ended_at))
      : null;
    return mins != null ? `Nursing · ${side} · ${mins}m` : `Nursing · ${side}`;
  }
  const label = f.type === "bottle" ? "Bottle" : "Formula";
  if (f.amount != null) return `${label} · ${f.amount}${f.unit || ""}`;
  return label;
}

export function diaperTitle(d: Diaper): string {
  if (d.kind === "wet") return "Diaper · wet";
  if (d.kind === "dirty") return "Diaper · dirty";
  return "Diaper · wet + dirty";
}

export function sleepTitle(s: Sleep): string {
  if (!s.ended_at) return "Sleep · ongoing";
  const hrs = minutesBetween(s.started_at, s.ended_at) / 60;
  return `Sleep · ${hrs.toFixed(1)}h`;
}

export function pumpingTitle(p: Pumping): string {
  if (p.amount_total != null) {
    return `Pump · ${p.amount_total}${p.unit || ""}`;
  }
  return "Pump";
}

export function medTitle(m: Medication): string {
  return `Med · ${m.name} ${m.dose}${m.unit ? ` ${m.unit}` : ""}`;
}

export function growthTitle(g: Growth): string {
  const parts: string[] = [];
  if (g.weight != null) parts.push(`${g.weight}${g.weight_unit || ""}`);
  if (g.length != null) parts.push(`${g.length}${g.length_unit || ""}`);
  return parts.length ? `Growth · ${parts.join(" · ")}` : "Growth";
}

export function buildTimeline(input: {
  feedings: Feeding[];
  diapers: Diaper[];
  sleeps: Sleep[];
  pumpings: Pumping[];
  medications: Medication[];
  growth: Growth[];
}): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  for (const f of input.feedings) {
    events.push({
      id: f.id,
      type: "feeding",
      at: f.started_at,
      title: feedingTitle(f),
      detail: formatLocal(f.started_at),
      payload: f as unknown as Record<string, unknown>,
    });
  }
  for (const d of input.diapers) {
    events.push({
      id: d.id,
      type: "diaper",
      at: d.logged_at,
      title: diaperTitle(d),
      detail: formatLocal(d.logged_at),
      payload: d as unknown as Record<string, unknown>,
    });
  }
  for (const s of input.sleeps) {
    events.push({
      id: s.id,
      type: "sleep",
      at: s.started_at,
      title: sleepTitle(s),
      detail: formatLocal(s.started_at),
      payload: s as unknown as Record<string, unknown>,
    });
  }
  for (const p of input.pumpings) {
    events.push({
      id: p.id,
      type: "pumping",
      at: p.started_at,
      title: pumpingTitle(p),
      detail: formatLocal(p.started_at),
      payload: p as unknown as Record<string, unknown>,
    });
  }
  for (const m of input.medications) {
    events.push({
      id: m.id,
      type: "medication",
      at: m.given_at,
      title: medTitle(m),
      detail: formatLocal(m.given_at),
      payload: m as unknown as Record<string, unknown>,
    });
  }
  for (const g of input.growth) {
    events.push({
      id: g.id,
      type: "growth",
      at: g.measured_at,
      title: growthTitle(g),
      detail: formatLocal(g.measured_at),
      payload: g as unknown as Record<string, unknown>,
    });
  }

  return events.sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  );
}
