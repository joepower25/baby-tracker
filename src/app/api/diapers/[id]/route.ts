import { noStore, requireCaregiverAccess } from "@/lib/auth";
import { sql } from "@/lib/db";
import type { Diaper } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const access = await requireCaregiverAccess(request);
  if (access instanceof Response) return access;
  const { id } = await ctx.params;
  const existing = await sql<Diaper>(
    `select id, baby_id, caregiver_sub, kind,
            logged_at::text as logged_at, notes, created_at::text as created_at
     from diapers where id = $1 and baby_id = $2`,
    [id, access.baby.id],
  );
  if (!existing[0]) {
    return Response.json({ error: "not_found" }, { status: 404, headers: noStore });
  }
  const cur = existing[0];
  const body = (await request.json().catch(() => null)) as Partial<{
    kind: string;
    loggedAt: string;
    notes: string | null;
  }> | null;
  const kind =
    body?.kind && ["wet", "dirty", "both"].includes(body.kind) ? body.kind : cur.kind;
  const rows = await sql<Diaper>(
    `update diapers set kind = $1, logged_at = $2::timestamptz, notes = $3
     where id = $4 and baby_id = $5
     returning id, baby_id, caregiver_sub, kind,
               logged_at::text as logged_at, notes, created_at::text as created_at`,
    [
      kind,
      body?.loggedAt || cur.logged_at,
      body?.notes !== undefined ? body.notes?.trim() || null : cur.notes,
      id,
      access.baby.id,
    ],
  );
  return Response.json({ diaper: rows[0] }, { headers: noStore });
}

export async function DELETE(request: Request, ctx: Ctx) {
  const access = await requireCaregiverAccess(request);
  if (access instanceof Response) return access;
  const { id } = await ctx.params;
  const rows = await sql(
    `delete from diapers where id = $1 and baby_id = $2 returning id`,
    [id, access.baby.id],
  );
  if (!rows[0]) {
    return Response.json({ error: "not_found" }, { status: 404, headers: noStore });
  }
  return new Response(null, { status: 204, headers: noStore });
}
