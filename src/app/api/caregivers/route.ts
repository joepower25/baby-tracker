import { noStore, requireCaregiverAccess } from "@/lib/auth";
import { sql } from "@/lib/db";
import type { Caregiver } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const access = await requireCaregiverAccess(request);
  if (access instanceof Response) return access;

  const caregivers = await sql<Caregiver>(
    `select id, baby_id, viewer_sub, display_name, role,
            created_at::text as created_at
     from caregivers
     where baby_id = $1
     order by created_at asc`,
    [access.baby.id],
  );

  return Response.json(
    {
      caregivers: caregivers.map((c) => ({
        id: c.id,
        displayName: c.display_name,
        role: c.role,
        createdAt: c.created_at,
        isYou: c.viewer_sub === access.viewer.sub,
      })),
      inviteCode:
        access.caregiver.role === "owner"
          ? access.baby.invite_code_plain
          : null,
    },
    { headers: noStore },
  );
}
