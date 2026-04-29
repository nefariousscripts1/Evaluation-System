import { NextResponse } from "next/server";
import { getLeadershipResultsData } from "@/lib/leadership-portal";
import { getResultsAccessContext } from "@/lib/results-access";
import { isResultsNotReleasedError } from "@/lib/results-release";
import { requireApiSession } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(["dean"]);
    const accessContext = getResultsAccessContext(session);

    const deanId = Number.parseInt(session.user.id ?? "", 10);
    if (!Number.isInteger(deanId) || !accessContext) {
      return NextResponse.json({ message: "Invalid session user" }, { status: 401 });
    }

    const data = await getLeadershipResultsData({
      request,
      sessionUserId: deanId,
      sessionUserName: session.user.name,
      sessionUserEmail: session.user.email,
      viewerRoleLabel: "Dean",
      targetRole: "chairperson",
      accessContext,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Dean results API error:", error);
    if (isResultsNotReleasedError(error)) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    return NextResponse.json({ message: "Failed to fetch dean results" }, { status: 500 });
  }
}
