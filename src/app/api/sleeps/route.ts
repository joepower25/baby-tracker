import { noStore, requireCaregiverAccess } from "@/lib/auth";
import { sql } from "@/lib/db";
import type { Sleep } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const access = await requireCaregiverAccess(request);
  if (access instanceof Response) return access;
  const rows = await sql<Sleep>(
    `select id, baby_id, caregiver_sub,
            started_at::text as started_at, ended_at::text as ended_at,
            notes, created_at::text as created_at
     from sleeps where baby_id = $1
     order by started_at desc limit 100`,
    [access.baby.id],
  );
  return Response.json({ sleeps: rows }, { headers: noStore });
}

export async function POST(request: Request) {
  const access = await requireCaregiverAccess(request);
  if (access instanceof Response) return access;
  const body = (await request.json().catch(() => null)) as Partial<{
    startedAt: string;
    endedAt: string | null;
    notes: string | null;
    action: "start" | "end";
  }> | null;

  if (body?.action === "end") {
    const open = await sql<Sleep>(
      `select id, baby_id, caregiver_sub,
              started_at::text as started_at, ended_at::text as ended_at,
              notes, created_at::text as created_at
       from sleeps
       where baby_id = $1 and ended_at is null
       order by started_at desc limit 1`,
      [access.baby.id],
    );
    if (!open[0]) {
      return Response.json({ error: "no_open_sleep" }, { status: 404, headers: noStore });
    }
    const rows = await sql<Sleep>(
      `update sleeps set ended_at = $1::timestamptz
       where id = $2
       returning id, baby_id, caregiver_sub,
                 started_at::text as started_at, ended_at::text as ended_at,
                 notes, created_at::text as created_at`,
      [body.endedAt || new Date().toISOString(), open[0].id],
    );
    return Response.json({ sleep: rows[0] }, { headers: noStore });
  }

  const open = await sql(
    `select id from sleeps where baby_id = $1 and ended_at is null limit 1`,
    [access.baby.id],
  );
  if (open[0] && !body?.endedAt) {
    return Response.json(
      { error: "already_asleep" },
      { status: 409, headers: noStore },
    );
  }

  const rows = await sql<Sleep>(
    `insert into sleeps (baby_id, caregiver_sub, started_at, ended_at, notes)
     values ($1,$2,$3::timestamptz,$4::timestamptz,$5)
     returning id, baby_id, caregiver_sub,
               started_at::text as started_at, ended_at::text as ended_at,
               notes, created_at::text as created_at`,
    [
      access.baby.id,
      access.viewer.sub,
      body?.startedAt || new Date().toISOString(),
      body?.endedAt || null,
      body?.notes?.trim() || null,
    ],
  );
  return Response.json({ sleep: rows[0] }, { status: 201, headers: noStore });
}
