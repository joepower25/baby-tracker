import { subDays, eachDayOfInterval, format, parseISO, startOfDay } from "date-fns";
import { noStore, requireCaregiverAccess } from "@/lib/auth";
import { sql } from "@/lib/db";
import { dayKey, minutesBetween } from "@/lib/format";
import type {
  Diaper,
  Feeding,
  Growth,
  Medication,
  Pumping,
  Sleep,
} from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const access = await requireCaregiverAccess(request);
  if (access instanceof Response) return access;

  const url = new URL(request.url);
  const daysParam = Number(url.searchParams.get("days") || "7");
  const days = [7, 14, 30].includes(daysParam) ? daysParam : 7;
  const end = new Date();
  const start = startOfDay(subDays(end, days - 1));
  const startIso = start.toISOString();
  const babyId = access.baby.id;

  const dayKeys = eachDayOfInterval({ start, end }).map((d) =>
    format(d, "yyyy-MM-dd"),
  );

  const [feedings, diapers, sleeps, pumpings, medications, growth] =
    await Promise.all([
      sql<Feeding>(
        `select id, type, side, amount, unit,
                started_at::text as started_at, ended_at::text as ended_at
         from feedings where baby_id = $1 and started_at >= $2::timestamptz`,
        [babyId, startIso],
      ),
      sql<Diaper>(
        `select id, kind, logged_at::text as logged_at
         from diapers where baby_id = $1 and logged_at >= $2::timestamptz`,
        [babyId, startIso],
      ),
      sql<Sleep>(
        `select id, started_at::text as started_at, ended_at::text as ended_at
         from sleeps where baby_id = $1 and started_at >= $2::timestamptz`,
        [babyId, startIso],
      ),
      sql<Pumping>(
        `select id, amount_total, unit, started_at::text as started_at
         from pumpings where baby_id = $1 and started_at >= $2::timestamptz`,
        [babyId, startIso],
      ),
      sql<Medication>(
        `select id, name, dose, unit, given_at::text as given_at
         from medications where baby_id = $1 and given_at >= $2::timestamptz`,
        [babyId, startIso],
      ),
      sql<Growth>(
        `select id, weight, weight_unit, length, length_unit,
                measured_at::text as measured_at
         from growth where baby_id = $1
         order by measured_at asc`,
        [babyId],
      ),
    ]);

  const feedsPerDay = dayKeys.map((day) => {
    const dayFeeds = feedings.filter((f) => dayKey(f.started_at) === day);
    return {
      day,
      label: format(parseISO(day), "MMM d"),
      breast: dayFeeds.filter((f) => f.type === "breast").length,
      bottle: dayFeeds.filter((f) => f.type === "bottle").length,
      formula: dayFeeds.filter((f) => f.type === "formula").length,
      total: dayFeeds.length,
    };
  });

  const volumePerDay = dayKeys.map((day) => {
    const dayFeeds = feedings.filter(
      (f) =>
        dayKey(f.started_at) === day &&
        (f.type === "bottle" || f.type === "formula") &&
        f.amount != null,
    );
    const volume = dayFeeds.reduce((sum, f) => sum + Number(f.amount || 0), 0);
    return {
      day,
      label: format(parseISO(day), "MMM d"),
      volume: Number(volume.toFixed(2)),
    };
  });

  const nursingPerDay = dayKeys.map((day) => {
    const dayFeeds = feedings.filter(
      (f) => f.type === "breast" && dayKey(f.started_at) === day && f.ended_at,
    );
    let left = 0;
    let right = 0;
    let both = 0;
    for (const f of dayFeeds) {
      const mins = minutesBetween(f.started_at, f.ended_at);
      if (f.side === "left") left += mins;
      else if (f.side === "right") right += mins;
      else both += mins;
    }
    return {
      day,
      label: format(parseISO(day), "MMM d"),
      left: Math.round(left),
      right: Math.round(right),
      both: Math.round(both),
      total: Math.round(left + right + both),
    };
  });

  const diapersPerDay = dayKeys.map((day) => {
    const dayDiapers = diapers.filter((d) => dayKey(d.logged_at) === day);
    let wet = 0;
    let dirty = 0;
    for (const d of dayDiapers) {
      if (d.kind === "wet") wet += 1;
      else if (d.kind === "dirty") dirty += 1;
      else {
        wet += 1;
        dirty += 1;
      }
    }
    return {
      day,
      label: format(parseISO(day), "MMM d"),
      wet,
      dirty,
      total: dayDiapers.length,
    };
  });

  const sleepPerDay = dayKeys.map((day) => {
    const daySleeps = sleeps.filter(
      (s) => dayKey(s.started_at) === day && s.ended_at,
    );
    const hours = daySleeps.reduce(
      (sum, s) => sum + minutesBetween(s.started_at, s.ended_at) / 60,
      0,
    );
    const avgNap =
      daySleeps.length > 0
        ? hours / daySleeps.length
        : 0;
    return {
      day,
      label: format(parseISO(day), "MMM d"),
      hours: Number(hours.toFixed(2)),
      avgNapHours: Number(avgNap.toFixed(2)),
      sessions: daySleeps.length,
    };
  });

  const pumpPerDay = dayKeys.map((day) => {
    const dayPumps = pumpings.filter((p) => dayKey(p.started_at) === day);
    const volume = dayPumps.reduce(
      (sum, p) => sum + Number(p.amount_total || 0),
      0,
    );
    return {
      day,
      label: format(parseISO(day), "MMM d"),
      volume: Number(volume.toFixed(2)),
    };
  });

  const medCounts: Record<string, number> = {};
  for (const m of medications) {
    medCounts[m.name] = (medCounts[m.name] || 0) + 1;
  }
  const medsByName = Object.entries(medCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const growthSeries = growth
    .filter((g) => g.weight != null)
    .map((g) => ({
      at: g.measured_at,
      label: format(parseISO(g.measured_at), "MMM d"),
      weight: Number(g.weight),
      weightUnit: g.weight_unit,
      length: g.length != null ? Number(g.length) : null,
      lengthUnit: g.length_unit,
    }));

  return Response.json(
    {
      days,
      volumeUnit: access.baby.volume_unit,
      weightUnit: access.baby.weight_unit,
      feedsPerDay,
      volumePerDay,
      nursingPerDay,
      diapersPerDay,
      sleepPerDay,
      pumpPerDay,
      medsByName,
      growthSeries,
      empty:
        feedings.length +
          diapers.length +
          sleeps.length +
          pumpings.length +
          medications.length +
          growth.length ===
        0,
    },
    { headers: noStore },
  );
}
