import { noStore, requireCaregiverAccess } from "@/lib/auth";
import { sql } from "@/lib/db";
import type { Diaper } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const access = await requireCaregiverAccess(request);
  if (access instanceof Response) return access;
  const rows = await sql<Diaper>(
    `select id, baby_id, caregiver_sub, kind,
            logged_at::text as logged_at, notes, created_at::text as created_at
     from diapers where baby_id = $1
     order by logged_at desc limit 100`,
    [access.baby.id],
  );
  return Response.json({ diapers: rows }, { headers: noStore });
}

export async function POST(request: Request) {
  const access = await requireCaregiverAccess(request);
  if (access instanceof Response) return access;
  const body = (await request.json().catch(() => null)) as Partial<{
    kind: string;
    loggedAt: string;
    notes: string | null;
  }> | null;
  const kind = body?.kind;
  if (!kind || !["wet", "dirty", "both"].includes(kind)) {
    return Response.json({ error: "invalid_kind" }, { status: 400, headers: noStore });
  }
  const rows = await sql<Diaper>(
    `insert into diapers (baby_id, caregiver_sub, kind, logged_at, notes)
     values ($1,$2,$3,$4::timestamptz,$5)
     returning id, baby_id, caregiver_sub, kind,
               logged_at::text as logged_at, notes, created_at::text as created_at`,
    [
      access.baby.id,
      access.viewer.sub,
      kind,
      body?.loggedAt || new Date().toISOString(),
      body?.notes?.trim() || null,
    ],
  );
  return Response.json({ diaper: rows[0] }, { status: 201, headers: noStore });
}
