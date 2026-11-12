import { getIdentity } from "../../../../cursor/identity";
import { getCaregiverBaby, noStore } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const identity = await getIdentity(request);
  if (!identity.verified) {
    return Response.json(
      { verified: false, reason: identity.reason },
      { status: 401, headers: noStore },
    );
  }
  if (identity.kind === "key") {
    return Response.json(
      { verified: false, reason: "person_required" },
      { status: 403, headers: noStore },
    );
  }
  const access = await getCaregiverBaby(identity.sub);
  return Response.json(
    {
      verified: true,
      simulated: identity.simulated,
      viewer: {
        name: identity.name || identity.email || "Caregiver",
        email: identity.email,
      },
      baby: access?.baby ?? null,
      caregiver: access?.caregiver ?? null,
    },
    { headers: noStore },
  );
}
