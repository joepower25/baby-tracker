import {
  getCaregiverBaby,
  noStore,
  requireViewer,
} from "@/lib/auth";
import { sql } from "@/lib/db";
import { hashInviteCode } from "@/lib/invite";

export const dynamic = "force-dynamic";

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
    code?: string;
  } | null;
  const code = body?.code?.trim().toUpperCase();
  if (!code || code.length < 4) {
    return Response.json(
      { error: "invite_code_required" },
      { status: 400, headers: noStore },
    );
  }

  const hash = hashInviteCode(code);
  const babies = await sql<{ id: string; name: string }>(
    `select id, name from babies where invite_code_hash = $1 limit 1`,
    [hash],
  );
  const baby = babies[0];
  if (!baby) {
    return Response.json(
      { error: "invalid_invite_code" },
      { status: 404, headers: noStore },
    );
  }

  await sql(
    `insert into caregivers (baby_id, viewer_sub, display_name, role)
     values ($1, $2, $3, 'caregiver')
     on conflict (baby_id, viewer_sub) do nothing`,
    [baby.id, viewer.sub, viewer.name],
  );

  const access = await getCaregiverBaby(viewer.sub);
  return Response.json(access, { status: 201, headers: noStore });
}
