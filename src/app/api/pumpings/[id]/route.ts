import { noStore, requireCaregiverAccess } from "@/lib/auth";
import { sql } from "@/lib/db";
import type { Pumping } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const access = await requireCaregiverAccess(request);
  if (access instanceof Response) return access;
  const { id } = await ctx.params;
  const existing = await sql<Pumping>(
    `select id, baby_id, caregiver_sub,
            started_at::text as started_at, ended_at::text as ended_at,
            amount_left, amount_right, amount_total, unit, notes,
            created_at::text as created_at
     from pumpings where id = $1 and baby_id = $2`,
    [id, access.baby.id],
  );
  if (!existing[0]) {
    return Response.json({ error: "not_found" }, { status: 404, headers: noStore });
  }
  const cur = existing[0];
  const body = (await request.json().catch(() => null)) as Partial<{
    startedAt: string;
    endedAt: string | null;
    amountLeft: number | null;
    amountRight: number | null;
    amountTotal: number | null;
    unit: string | null;
    notes: string | null;
  }> | null;

  const left = body?.amountLeft !== undefined ? body.amountLeft : cur.amount_left;
  const right = body?.amountRight !== undefined ? body.amountRight : cur.amount_right;
  let total = body?.amountTotal !== undefined ? body.amountTotal : cur.amount_total;
  if (body?.amountLeft !== undefined || body?.amountRight !== undefined) {
    if (total == null || body?.amountTotal === undefined) {
      total = (Number(left) || 0) + (Number(right) || 0);
    }
  }
  const unit =
    body?.unit ||
    cur.unit ||
    (total != null ? access.baby.volume_unit : null);

  const rows = await sql<Pumping>(
    `update pumpings set
       started_at = $1::timestamptz, ended_at = $2::timestamptz,
       amount_left = $3, amount_right = $4, amount_total = $5, unit = $6, notes = $7
     where id = $8 and baby_id = $9
     returning id, baby_id, caregiver_sub,
               started_at::text as started_at, ended_at::text as ended_at,
               amount_left, amount_right, amount_total, unit, notes,
               created_at::text as created_at`,
    [
      body?.startedAt || cur.started_at,
      body?.endedAt !== undefined ? body.endedAt : cur.ended_at,
      left,
      right,
      total,
      unit,
      body?.notes !== undefined ? body.notes?.trim() || null : cur.notes,
      id,
      access.baby.id,
    ],
  );
  return Response.json({ pumping: rows[0] }, { headers: noStore });
}

export async function DELETE(request: Request, ctx: Ctx) {
  const access = await requireCaregiverAccess(request);
  if (access instanceof Response) return access;
  const { id } = await ctx.params;
  const rows = await sql(
    `delete from pumpings where id = $1 and baby_id = $2 returning id`,
    [id, access.baby.id],
  );
  if (!rows[0]) {
    return Response.json({ error: "not_found" }, { status: 404, headers: noStore });
  }
  return new Response(null, { status: 204, headers: noStore });
}
