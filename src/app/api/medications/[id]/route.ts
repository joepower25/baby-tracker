import { noStore, requireCaregiverAccess } from "@/lib/auth";
import { sql } from "@/lib/db";
import type { Medication } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const access = await requireCaregiverAccess(request);
  if (access instanceof Response) return access;
  const { id } = await ctx.params;
  const existing = await sql<Medication>(
    `select id, baby_id, caregiver_sub, name, dose, unit,
            given_at::text as given_at, due_again_at::text as due_again_at,
            notes, created_at::text as created_at
     from medications where id = $1 and baby_id = $2`,
    [id, access.baby.id],
  );
  if (!existing[0]) {
    return Response.json({ error: "not_found" }, { status: 404, headers: noStore });
  }
  const cur = existing[0];
  const body = (await request.json().catch(() => null)) as Partial<{
    name: string;
    dose: string;
    unit: string | null;
    givenAt: string;
    dueAgainAt: string | null;
    notes: string | null;
  }> | null;

  const rows = await sql<Medication>(
    `update medications set
       name = $1, dose = $2, unit = $3, given_at = $4::timestamptz,
       due_again_at = $5::timestamptz, notes = $6
     where id = $7 and baby_id = $8
     returning id, baby_id, caregiver_sub, name, dose, unit,
               given_at::text as given_at, due_again_at::text as due_again_at,
               notes, created_at::text as created_at`,
    [
      body?.name?.trim() || cur.name,
      body?.dose?.trim() || cur.dose,
      body?.unit !== undefined ? body.unit?.trim() || null : cur.unit,
      body?.givenAt || cur.given_at,
      body?.dueAgainAt !== undefined ? body.dueAgainAt : cur.due_again_at,
      body?.notes !== undefined ? body.notes?.trim() || null : cur.notes,
      id,
      access.baby.id,
    ],
  );
  return Response.json({ medication: rows[0] }, { headers: noStore });
}

export async function DELETE(request: Request, ctx: Ctx) {
  const access = await requireCaregiverAccess(request);
  if (access instanceof Response) return access;
  const { id } = await ctx.params;
  const rows = await sql(
    `delete from medications where id = $1 and baby_id = $2 returning id`,
    [id, access.baby.id],
  );
  if (!rows[0]) {
    return Response.json({ error: "not_found" }, { status: 404, headers: noStore });
  }
  return new Response(null, { status: 204, headers: noStore });
}
