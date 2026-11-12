import { generateInviteCode, hashInviteCode } from "@/lib/invite";
import { noStore, requireCaregiverAccess } from "@/lib/auth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const access = await requireCaregiverAccess(request);
  if (access instanceof Response) return access;
  if (access.caregiver.role !== "owner") {
    return Response.json(
      { error: "owner_required" },
      { status: 403, headers: noStore },
    );
  }

  const code = generateInviteCode();
  const hash = hashInviteCode(code);
  await sql(
    `update babies set invite_code_hash = $1, invite_code_plain = $2 where id = $3`,
    [hash, code, access.baby.id],
  );

  return Response.json({ inviteCode: code }, { headers: noStore });
}
