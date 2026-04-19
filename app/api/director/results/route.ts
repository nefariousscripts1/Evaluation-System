import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getLeadershipResultsData } from "@/lib/leadership-portal";
import { isResultsNotReleasedError } from "@/lib/results-release";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "director") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const directorId = Number.parseInt(session.user.id ?? "", 10);
    if (!Number.isInteger(directorId)) {
      return NextResponse.json({ message: "Invalid session user" }, { status: 401 });
    }

    const data = await getLeadershipResultsData({
      request,
      sessionUserId: directorId,
      sessionUserName: session.user.name,
      sessionUserEmail: session.user.email,
      viewerRoleLabel: "DOI",
      targetRole: "dean",
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
