import { noStore, requireCaregiverAccess } from "@/lib/auth";
import { sql } from "@/lib/db";
import type { Growth } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const access = await requireCaregiverAccess(request);
  if (access instanceof Response) return access;
  const rows = await sql<Growth>(
    `select id, baby_id, caregiver_sub, weight, weight_unit, length, length_unit,
            measured_at::text as measured_at, notes, created_at::text as created_at
     from growth where baby_id = $1
     order by measured_at desc limit 100`,
    [access.baby.id],
  );
  return Response.json({ growth: rows }, { headers: noStore });
}

export async function POST(request: Request) {
  const access = await requireCaregiverAccess(request);
  if (access instanceof Response) return access;
  const body = (await request.json().catch(() => null)) as Partial<{
    weight: number | null;
    weightUnit: string | null;
    length: number | null;
    lengthUnit: string | null;
    measuredAt: string;
    notes: string | null;
  }> | null;

  const weight = body?.weight != null ? Number(body.weight) : null;
  const length = body?.length != null ? Number(body.length) : null;
  if ((weight == null || weight <= 0) && (length == null || length <= 0)) {
    return Response.json(
      { error: "weight_or_length_required" },
      { status: 400, headers: noStore },
    );
  }

  const rows = await sql<Growth>(
    `insert into growth
       (baby_id, caregiver_sub, weight, weight_unit, length, length_unit, measured_at, notes)
     values ($1,$2,$3,$4,$5,$6,$7::timestamptz,$8)
     returning id, baby_id, caregiver_sub, weight, weight_unit, length, length_unit,
               measured_at::text as measured_at, notes, created_at::text as created_at`,
    [
      access.baby.id,
      access.viewer.sub,
      weight,
      weight != null
        ? body?.weightUnit === "kg"
          ? "kg"
          : access.baby.weight_unit
        : null,
      length,
      length != null
        ? body?.lengthUnit === "cm"
          ? "cm"
          : "in"
        : null,
      body?.measuredAt || new Date().toISOString(),
      body?.notes?.trim() || null,
    ],
  );
  return Response.json({ growth: rows[0] }, { status: 201, headers: noStore });
}
