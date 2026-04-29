import { NextResponse } from "next/server";
import { getLeadershipResultsData } from "@/lib/leadership-portal";
import { getResultsAccessContext } from "@/lib/results-access";
import { isResultsNotReleasedError } from "@/lib/results-release";
import { requireApiSession } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(["chairperson"]);
    const accessContext = getResultsAccessContext(session);

    const chairpersonId = Number.parseInt(session.user.id ?? "", 10);
    if (!Number.isInteger(chairpersonId) || !accessContext) {
      return NextResponse.json({ message: "Invalid session user" }, { status: 401 });
    }

    const data = await getLeadershipResultsData({
      request,
      sessionUserId: chairpersonId,
      sessionUserName: session.user.name,
      sessionUserEmail: session.user.email,
      viewerRoleLabel: "Chairperson",
      targetRole: "faculty",
      accessContext,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Chairperson results API error:", error);
    if (isResultsNotReleasedError(error)) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { message: "Failed to fetch chairperson results" },
      { status: 500 }
    );
  }
}
