import { noStore, requireCaregiverAccess } from "@/lib/auth";
import { sql } from "@/lib/db";
import { buildTimeline } from "@/lib/timeline";
import type {
  Diaper,
  Feeding,
  Growth,
  Medication,
  Pumping,
  Sleep,
  TimelineEventType,
} from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const access = await requireCaregiverAccess(request);
  if (access instanceof Response) return access;
  const url = new URL(request.url);
  const type = url.searchParams.get("type") as TimelineEventType | "all" | null;
  const babyId = access.baby.id;

  const [feedings, diapers, sleeps, pumpings, medications, growth] =
    await Promise.all([
      sql<Feeding>(
        `select id, baby_id, caregiver_sub, type, side, amount, unit,
                started_at::text as started_at, ended_at::text as ended_at,
                notes, created_at::text as created_at
         from feedings where baby_id = $1 order by started_at desc limit 200`,
        [babyId],
      ),
      sql<Diaper>(
        `select id, baby_id, caregiver_sub, kind,
                logged_at::text as logged_at, notes, created_at::text as created_at
         from diapers where baby_id = $1 order by logged_at desc limit 200`,
        [babyId],
      ),
      sql<Sleep>(
        `select id, baby_id, caregiver_sub,
                started_at::text as started_at, ended_at::text as ended_at,
                notes, created_at::text as created_at
         from sleeps where baby_id = $1 order by started_at desc limit 200`,
        [babyId],
      ),
      sql<Pumping>(
        `select id, baby_id, caregiver_sub,
                started_at::text as started_at, ended_at::text as ended_at,
                amount_left, amount_right, amount_total, unit, notes,
                created_at::text as created_at
         from pumpings where baby_id = $1 order by started_at desc limit 200`,
        [babyId],
      ),
      sql<Medication>(
        `select id, baby_id, caregiver_sub, name, dose, unit,
                given_at::text as given_at, due_again_at::text as due_again_at,
                notes, created_at::text as created_at
         from medications where baby_id = $1 order by given_at desc limit 200`,
        [babyId],
      ),
      sql<Growth>(
        `select id, baby_id, caregiver_sub, weight, weight_unit, length, length_unit,
                measured_at::text as measured_at, notes, created_at::text as created_at
         from growth where baby_id = $1 order by measured_at desc limit 200`,
        [babyId],
      ),
    ]);

  let events = buildTimeline({
    feedings,
    diapers,
    sleeps,
    pumpings,
    medications,
    growth,
  });
  if (type && type !== "all") {
    events = events.filter((e) => e.type === type);
  }

  return Response.json({ events }, { headers: noStore });
}
