import { noStore, requireCaregiverAccess } from "@/lib/auth";
import { sql } from "@/lib/db";
import type { Pumping } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const access = await requireCaregiverAccess(request);
  if (access instanceof Response) return access;
  const rows = await sql<Pumping>(
    `select id, baby_id, caregiver_sub,
            started_at::text as started_at, ended_at::text as ended_at,
            amount_left, amount_right, amount_total, unit, notes,
            created_at::text as created_at
     from pumpings where baby_id = $1
     order by started_at desc limit 100`,
    [access.baby.id],
  );
  return Response.json({ pumpings: rows }, { headers: noStore });
}

export async function POST(request: Request) {
  const access = await requireCaregiverAccess(request);
  if (access instanceof Response) return access;
  const body = (await request.json().catch(() => null)) as Partial<{
    startedAt: string;
    endedAt: string | null;
    amountLeft: number | null;
    amountRight: number | null;
    amountTotal: number | null;
    unit: string | null;
    notes: string | null;
  }> | null;

  const left = body?.amountLeft != null ? Number(body.amountLeft) : null;
  const right = body?.amountRight != null ? Number(body.amountRight) : null;
  let total = body?.amountTotal != null ? Number(body.amountTotal) : null;
  if (total == null && (left != null || right != null)) {
    total = (left || 0) + (right || 0);
  }
  const unit =
    total != null || left != null || right != null
      ? body?.unit === "ml"
        ? "ml"
        : access.baby.volume_unit
      : null;

  const rows = await sql<Pumping>(
    `insert into pumpings
       (baby_id, caregiver_sub, started_at, ended_at, amount_left, amount_right, amount_total, unit, notes)
     values ($1,$2,$3::timestamptz,$4::timestamptz,$5,$6,$7,$8,$9)
     returning id, baby_id, caregiver_sub,
               started_at::text as started_at, ended_at::text as ended_at,
               amount_left, amount_right, amount_total, unit, notes,
               created_at::text as created_at`,
    [
      access.baby.id,
      access.viewer.sub,
      body?.startedAt || new Date().toISOString(),
      body?.endedAt || null,
      left,
      right,
      total,
      unit,
      body?.notes?.trim() || null,
    ],
  );
  return Response.json({ pumping: rows[0] }, { status: 201, headers: noStore });
}
