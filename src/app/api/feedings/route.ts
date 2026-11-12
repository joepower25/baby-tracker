import { noStore, requireCaregiverAccess } from "@/lib/auth";
import { sql } from "@/lib/db";
import type { Feeding } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const access = await requireCaregiverAccess(request);
  if (access instanceof Response) return access;
  const rows = await sql<Feeding>(
    `select id, baby_id, caregiver_sub, type, side, amount, unit,
            started_at::text as started_at, ended_at::text as ended_at,
            notes, created_at::text as created_at
     from feedings where baby_id = $1
     order by started_at desc limit 100`,
    [access.baby.id],
  );
  return Response.json({ feedings: rows }, { headers: noStore });
}

export async function POST(request: Request) {
  const access = await requireCaregiverAccess(request);
  if (access instanceof Response) return access;
  const body = (await request.json().catch(() => null)) as Partial<{
    type: string;
    side: string | null;
    amount: number | null;
    unit: string | null;
    startedAt: string;
    endedAt: string | null;
    notes: string | null;
  }> | null;

  const type = body?.type;
  if (!type || !["breast", "bottle", "formula"].includes(type)) {
    return Response.json({ error: "invalid_type" }, { status: 400, headers: noStore });
  }
  const startedAt = body?.startedAt || new Date().toISOString();
  const side =
    type === "breast" && body?.side && ["left", "right", "both"].includes(body.side)
      ? body.side
      : null;
  const amount =
    type !== "breast" && body?.amount != null && Number(body.amount) > 0
      ? Number(body.amount)
      : null;
  const unit =
    amount != null
      ? body?.unit === "ml"
        ? "ml"
        : access.baby.volume_unit
      : null;

  const rows = await sql<Feeding>(
    `insert into feedings
       (baby_id, caregiver_sub, type, side, amount, unit, started_at, ended_at, notes)
     values ($1,$2,$3,$4,$5,$6,$7::timestamptz,$8::timestamptz,$9)
     returning id, baby_id, caregiver_sub, type, side, amount, unit,
               started_at::text as started_at, ended_at::text as ended_at,
               notes, created_at::text as created_at`,
    [
      access.baby.id,
      access.viewer.sub,
      type,
      side,
      amount,
      unit,
      startedAt,
      body?.endedAt || null,
      body?.notes?.trim() || null,
    ],
  );
  return Response.json({ feeding: rows[0] }, { status: 201, headers: noStore });
}
