import { generateInviteCode, hashInviteCode } from "@/lib/invite";
import {
  getCaregiverBaby,
  noStore,
  requireViewer,
} from "@/lib/auth";
import { sql } from "@/lib/db";
import type { Baby } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const viewer = await requireViewer(request);
  if (viewer instanceof Response) return viewer;
  const access = await getCaregiverBaby(viewer.sub);
  if (!access) {
    return Response.json({ baby: null }, { headers: noStore });
  }
  return Response.json(access, { headers: noStore });
}

export async function POST(request: Request) {
  const viewer = await requireViewer(request);
  if (viewer instanceof Response) return viewer;

  const existing = await getCaregiverBaby(viewer.sub);
  if (existing) {
    return Response.json(
      { error: "already_has_baby", baby: existing.baby },
      { status: 409, headers: noStore },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    name?: string;
    birthDate?: string;
  } | null;
  const name = body?.name?.trim();
  const birthDate = body?.birthDate?.trim();
  if (!name || !birthDate) {
    return Response.json(
      { error: "name_and_birth_date_required" },
      { status: 400, headers: noStore },
    );
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    return Response.json(
      { error: "invalid_birth_date" },
      { status: 400, headers: noStore },
    );
  }

  const code = generateInviteCode();
  const codeHash = hashInviteCode(code);

  const babies = await sql<Baby>(
    `insert into babies (name, birth_date, invite_code_hash, invite_code_plain)
     values ($1, $2::date, $3, $4)
     returning id, name, birth_date::text as birth_date, invite_code_plain,
               volume_unit, weight_unit, created_at::text as created_at`,
    [name, birthDate, codeHash, code],
  );
  const baby = babies[0]!;

  await sql(
    `insert into caregivers (baby_id, viewer_sub, display_name, role)
     values ($1, $2, $3, 'owner')`,
    [baby.id, viewer.sub, viewer.name],
  );

  const access = await getCaregiverBaby(viewer.sub);
  return Response.json(access, { status: 201, headers: noStore });
}

export async function PATCH(request: Request) {
  const viewer = await requireViewer(request);
  if (viewer instanceof Response) return viewer;
  const access = await getCaregiverBaby(viewer.sub);
  if (!access) {
    return Response.json({ error: "no_baby" }, { status: 404, headers: noStore });
  }
  if (access.caregiver.role !== "owner") {
    return Response.json({ error: "owner_required" }, { status: 403, headers: noStore });
  }

  const body = (await request.json().catch(() => null)) as {
    name?: string;
    birthDate?: string;
    volumeUnit?: "oz" | "ml";
    weightUnit?: "lb" | "kg";
  } | null;

  const name = body?.name?.trim() || access.baby.name;
  const birthDate = body?.birthDate?.trim() || access.baby.birth_date;
  const volumeUnit = body?.volumeUnit || access.baby.volume_unit;
  const weightUnit = body?.weightUnit || access.baby.weight_unit;

  if (!["oz", "ml"].includes(volumeUnit) || !["lb", "kg"].includes(weightUnit)) {
    return Response.json({ error: "invalid_units" }, { status: 400, headers: noStore });
  }

  await sql(
    `update babies set name = $1, birth_date = $2::date,
       volume_unit = $3, weight_unit = $4
     where id = $5`,
    [name, birthDate, volumeUnit, weightUnit, access.baby.id],
  );

  const updated = await getCaregiverBaby(viewer.sub);
  return Response.json(updated, { headers: noStore });
}
