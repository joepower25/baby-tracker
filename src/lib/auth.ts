import { requireIdentity } from "../../cursor/identity";
import { sql } from "./db";
import type { Baby, Caregiver } from "./types";

export type Viewer = {
  sub: string;
  name: string;
  email: string;
};

export async function requireViewer(
  request: Request,
): Promise<Viewer | Response> {
  const identity = await requireIdentity(request);
  if (identity instanceof Response) return identity;
  if (identity.kind === "key") {
    return Response.json(
      { error: "person_required" },
      { status: 403, headers: { "cache-control": "private, no-store" } },
    );
  }
  return {
    sub: identity.sub,
    name: identity.name || identity.email || "Caregiver",
    email: identity.email,
  };
}

export async function getCaregiverBaby(
  viewerSub: string,
): Promise<{ baby: Baby; caregiver: Caregiver } | null> {
  const rows = await sql<{
    baby_id: string;
    name: string;
    birth_date: string;
    invite_code_plain: string | null;
    volume_unit: Baby["volume_unit"];
    weight_unit: Baby["weight_unit"];
    baby_created_at: string;
    caregiver_id: string;
    viewer_sub: string;
    display_name: string;
    role: Caregiver["role"];
    caregiver_created_at: string;
  }>(
    `select b.id as baby_id, b.name, b.birth_date::text as birth_date,
            b.invite_code_plain, b.volume_unit, b.weight_unit,
            b.created_at::text as baby_created_at,
            c.id as caregiver_id, c.viewer_sub, c.display_name, c.role,
            c.created_at::text as caregiver_created_at
     from caregivers c
     join babies b on b.id = c.baby_id
     where c.viewer_sub = $1
     order by c.created_at asc
     limit 1`,
    [viewerSub],
  );
  const row = rows[0];
  if (!row) return null;
  return {
    baby: {
      id: row.baby_id,
      name: row.name,
      birth_date: row.birth_date,
      invite_code_plain: row.invite_code_plain,
      volume_unit: row.volume_unit,
      weight_unit: row.weight_unit,
      created_at: row.baby_created_at,
    },
    caregiver: {
      id: row.caregiver_id,
      baby_id: row.baby_id,
      viewer_sub: row.viewer_sub,
      display_name: row.display_name,
      role: row.role,
      created_at: row.caregiver_created_at,
    },
  };
}

export async function requireCaregiverAccess(
  request: Request,
): Promise<{ viewer: Viewer; baby: Baby; caregiver: Caregiver } | Response> {
  const viewer = await requireViewer(request);
  if (viewer instanceof Response) return viewer;
  const access = await getCaregiverBaby(viewer.sub);
  if (!access) {
    return Response.json(
      { error: "no_baby" },
      { status: 404, headers: { "cache-control": "private, no-store" } },
    );
  }
  return { viewer, ...access };
}

export const noStore = { "cache-control": "private, no-store" };
