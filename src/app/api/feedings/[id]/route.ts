import { noStore, requireCaregiverAccess } from "@/lib/auth";
import { sql } from "@/lib/db";
import type { Feeding } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const access = await requireCaregiverAccess(request);
  if (access instanceof Response) return access;
  const { id } = await ctx.params;
  const existing = await sql<Feeding>(
    `select id, baby_id, caregiver_sub, type, side, amount, unit,
            started_at::text as started_at, ended_at::text as ended_at,
            notes, created_at::text as created_at
     from feedings where id = $1 and baby_id = $2`,
    [id, access.baby.id],
  );
  if (!existing[0]) {
    return Response.json({ error: "not_found" }, { status: 404, headers: noStore });
  }

  const body = (await request.json().catch(() => null)) as Partial<{
    type: string;
    side: string | null;
    amount: number | null;
    unit: string | null;
    startedAt: string;
    endedAt: string | null;
    notes: string | null;
  }> | null;

  const cur = existing[0];
  const type =
    body?.type && ["breast", "bottle", "formula"].includes(body.type)
      ? body.type
      : cur.type;
  const side =
    type === "breast"
      ? body?.side && ["left", "right", "both"].includes(body.side)
        ? body.side
        : cur.side
      : null;
  const amount =
    type === "breast"
      ? null
      : body?.amount !== undefined
        ? body.amount
        : cur.amount;
  const unit = amount != null ? body?.unit || cur.unit || access.baby.volume_unit : null;

  const rows = await sql<Feeding>(
    `update feedings set
       type = $1, side = $2, amount = $3, unit = $4,
       started_at = $5::timestamptz, ended_at = $6::timestamptz, notes = $7
     where id = $8 and baby_id = $9
     returning id, baby_id, caregiver_sub, type, side, amount, unit,
               started_at::text as started_at, ended_at::text as ended_at,
               notes, created_at::text as created_at`,
    [
      type,
      side,
      amount,
      unit,
      body?.startedAt || cur.started_at,
      body?.endedAt !== undefined ? body.endedAt : cur.ended_at,
      body?.notes !== undefined ? body.notes?.trim() || null : cur.notes,
      id,
      access.baby.id,
    ],
  );
  return Response.json({ feeding: rows[0] }, { headers: noStore });
}

export async function DELETE(request: Request, ctx: Ctx) {
  const access = await requireCaregiverAccess(request);
  if (access instanceof Response) return access;
  const { id } = await ctx.params;
  const rows = await sql(
    `delete from feedings where id = $1 and baby_id = $2 returning id`,
    [id, access.baby.id],
  );
  if (!rows[0]) {
    return Response.json({ error: "not_found" }, { status: 404, headers: noStore });
  }
  return new Response(null, { status: 204, headers: noStore });
}
