import { noStore, requireCaregiverAccess } from "@/lib/auth";
import { sql } from "@/lib/db";
import type { Growth } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const access = await requireCaregiverAccess(request);
  if (access instanceof Response) return access;
  const { id } = await ctx.params;
  const existing = await sql<Growth>(
    `select id, baby_id, caregiver_sub, weight, weight_unit, length, length_unit,
            measured_at::text as measured_at, notes, created_at::text as created_at
     from growth where id = $1 and baby_id = $2`,
    [id, access.baby.id],
  );
  if (!existing[0]) {
    return Response.json({ error: "not_found" }, { status: 404, headers: noStore });
  }
  const cur = existing[0];
  const body = (await request.json().catch(() => null)) as Partial<{
    weight: number | null;
    weightUnit: string | null;
    length: number | null;
    lengthUnit: string | null;
    measuredAt: string;
    notes: string | null;
  }> | null;

  const weight = body?.weight !== undefined ? body.weight : cur.weight;
  const length = body?.length !== undefined ? body.length : cur.length;

  const rows = await sql<Growth>(
    `update growth set
       weight = $1, weight_unit = $2, length = $3, length_unit = $4,
       measured_at = $5::timestamptz, notes = $6
     where id = $7 and baby_id = $8
     returning id, baby_id, caregiver_sub, weight, weight_unit, length, length_unit,
               measured_at::text as measured_at, notes, created_at::text as created_at`,
    [
      weight,
      weight != null
        ? body?.weightUnit || cur.weight_unit || access.baby.weight_unit
        : null,
      length,
      length != null ? body?.lengthUnit || cur.length_unit || "in" : null,
      body?.measuredAt || cur.measured_at,
      body?.notes !== undefined ? body.notes?.trim() || null : cur.notes,
      id,
      access.baby.id,
    ],
  );
  return Response.json({ growth: rows[0] }, { headers: noStore });
}

export async function DELETE(request: Request, ctx: Ctx) {
  const access = await requireCaregiverAccess(request);
  if (access instanceof Response) return access;
  const { id } = await ctx.params;
  const rows = await sql(
    `delete from growth where id = $1 and baby_id = $2 returning id`,
    [id, access.baby.id],
  );
  if (!rows[0]) {
    return Response.json({ error: "not_found" }, { status: 404, headers: noStore });
  }
  return new Response(null, { status: 204, headers: noStore });
}
