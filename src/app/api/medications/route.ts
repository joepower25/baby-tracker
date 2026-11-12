import { noStore, requireCaregiverAccess } from "@/lib/auth";
import { sql } from "@/lib/db";
import type { Medication } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const access = await requireCaregiverAccess(request);
  if (access instanceof Response) return access;
  const rows = await sql<Medication>(
    `select id, baby_id, caregiver_sub, name, dose, unit,
            given_at::text as given_at, due_again_at::text as due_again_at,
            notes, created_at::text as created_at
     from medications where baby_id = $1
     order by given_at desc limit 100`,
    [access.baby.id],
  );
  return Response.json({ medications: rows }, { headers: noStore });
}

export async function POST(request: Request) {
  const access = await requireCaregiverAccess(request);
  if (access instanceof Response) return access;
  const body = (await request.json().catch(() => null)) as Partial<{
    name: string;
    dose: string;
    unit: string | null;
    givenAt: string;
    dueAgainAt: string | null;
    notes: string | null;
  }> | null;

  const name = body?.name?.trim();
  const dose = body?.dose?.trim();
  if (!name || !dose) {
    return Response.json(
      { error: "name_and_dose_required" },
      { status: 400, headers: noStore },
    );
  }

  const rows = await sql<Medication>(
    `insert into medications
       (baby_id, caregiver_sub, name, dose, unit, given_at, due_again_at, notes)
     values ($1,$2,$3,$4,$5,$6::timestamptz,$7::timestamptz,$8)
     returning id, baby_id, caregiver_sub, name, dose, unit,
               given_at::text as given_at, due_again_at::text as due_again_at,
               notes, created_at::text as created_at`,
    [
      access.baby.id,
      access.viewer.sub,
      name,
      dose,
      body?.unit?.trim() || null,
      body?.givenAt || new Date().toISOString(),
      body?.dueAgainAt || null,
      body?.notes?.trim() || null,
    ],
  );
  return Response.json({ medication: rows[0] }, { status: 201, headers: noStore });
}
