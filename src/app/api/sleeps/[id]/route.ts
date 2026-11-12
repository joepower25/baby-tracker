import { noStore, requireCaregiverAccess } from "@/lib/auth";
import { sql } from "@/lib/db";
import type { Sleep } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const access = await requireCaregiverAccess(request);
  if (access instanceof Response) return access;
  const { id } = await ctx.params;
  const existing = await sql<Sleep>(
    `select id, baby_id, caregiver_sub,
            started_at::text as started_at, ended_at::text as ended_at,
            notes, created_at::text as created_at
     from sleeps where id = $1 and baby_id = $2`,
    [id, access.baby.id],
  );
  if (!existing[0]) {
    return Response.json({ error: "not_found" }, { status: 404, headers: noStore });
  }
  const cur = existing[0];
  const body = (await request.json().catch(() => null)) as Partial<{
    startedAt: string;
    endedAt: string | null;
    notes: string | null;
  }> | null;
  const rows = await sql<Sleep>(
    `update sleeps set started_at = $1::timestamptz, ended_at = $2::timestamptz, notes = $3
     where id = $4 and baby_id = $5
     returning id, baby_id, caregiver_sub,
               started_at::text as started_at, ended_at::text as ended_at,
               notes, created_at::text as created_at`,
    [
      body?.startedAt || cur.started_at,
      body?.endedAt !== undefined ? body.endedAt : cur.ended_at,
      body?.notes !== undefined ? body.notes?.trim() || null : cur.notes,
      id,
      access.baby.id,
    ],
  );
  return Response.json({ sleep: rows[0] }, { headers: noStore });
}

export async function DELETE(request: Request, ctx: Ctx) {
  const access = await requireCaregiverAccess(request);
  if (access instanceof Response) return access;
  const { id } = await ctx.params;
  const rows = await sql(
    `delete from sleeps where id = $1 and baby_id = $2 returning id`,
    [id, access.baby.id],
  );
  if (!rows[0]) {
    return Response.json({ error: "not_found" }, { status: 404, headers: noStore });
  }
  return new Response(null, { status: 204, headers: noStore });
}
