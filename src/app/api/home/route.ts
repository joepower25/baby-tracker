import { noStore, requireCaregiverAccess } from "@/lib/auth";
import { sql } from "@/lib/db";
import { hoursBetween, relativeAge } from "@/lib/format";
import type { Diaper, Feeding, Sleep } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const access = await requireCaregiverAccess(request);
  if (access instanceof Response) return access;
  const babyId = access.baby.id;

  const [feeds, diapers, sleeps] = await Promise.all([
    sql<Feeding>(
      `select id, type, side, amount, unit,
              started_at::text as started_at, ended_at::text as ended_at
       from feedings where baby_id = $1
       order by started_at desc limit 1`,
      [babyId],
    ),
    sql<Diaper>(
      `select id, kind, logged_at::text as logged_at
       from diapers where baby_id = $1
       order by logged_at desc limit 1`,
      [babyId],
    ),
    sql<Sleep>(
      `select id, started_at::text as started_at, ended_at::text as ended_at
       from sleeps where baby_id = $1
       order by started_at desc limit 1`,
      [babyId],
    ),
  ]);

  const lastFeed = feeds[0] ?? null;
  const lastDiaper = diapers[0] ?? null;
  const lastSleep = sleeps[0] ?? null;
  const asleep = Boolean(lastSleep && !lastSleep.ended_at);

  return Response.json(
    {
      baby: access.baby,
      caregiver: access.caregiver,
      viewer: access.viewer,
      status: {
        lastFeed: lastFeed
          ? {
              ...lastFeed,
              ago: relativeAge(lastFeed.started_at),
            }
          : null,
        lastDiaper: lastDiaper
          ? {
              ...lastDiaper,
              ago: relativeAge(lastDiaper.logged_at),
              hoursSince: hoursBetween(lastDiaper.logged_at),
            }
          : null,
        sleep: lastSleep
          ? {
              ...lastSleep,
              asleep,
              durationHours: hoursBetween(
                lastSleep.started_at,
                lastSleep.ended_at,
              ),
              ago: relativeAge(lastSleep.started_at),
            }
          : null,
      },
    },
    { headers: noStore },
  );
}
