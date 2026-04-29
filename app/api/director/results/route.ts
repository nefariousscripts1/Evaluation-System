import { NextResponse } from "next/server";
import { getLeadershipResultsData } from "@/lib/leadership-portal";
import { getResultsAccessContext } from "@/lib/results-access";
import { isResultsNotReleasedError } from "@/lib/results-release";
import { requireApiSession } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(["director"]);
    const accessContext = getResultsAccessContext(session);

    const directorId = Number.parseInt(session.user.id ?? "", 10);
    if (!Number.isInteger(directorId) || !accessContext) {
      return NextResponse.json({ message: "Invalid session user" }, { status: 401 });
    }

    const data = await getLeadershipResultsData({
      request,
      sessionUserId: directorId,
      sessionUserName: session.user.name,
      sessionUserEmail: session.user.email,
      viewerRoleLabel: "DOI",
      targetRole: "dean",
      accessContext,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Director results API error:", error);
    if (isResultsNotReleasedError(error)) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    return NextResponse.json({ message: "Failed to fetch director results" }, { status: 500 });
  }
}
