import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getLeadershipCommentsData } from "@/lib/leadership-portal";
import { isResultsNotReleasedError } from "@/lib/results-release";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "chairperson") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const chairpersonId = Number.parseInt(session.user.id ?? "", 10);
    if (!Number.isInteger(chairpersonId)) {
      return NextResponse.json({ message: "Invalid session user" }, { status: 401 });
    }

    const data = await getLeadershipCommentsData({
      request,
      sessionUserId: chairpersonId,
      targetRole: "faculty",
      targetLabel: "Faculty",
    });

    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error && error.message === "Invalid semester filter"
        ? error.message
        : isResultsNotReleasedError(error)
        ? error.message
        : "Failed to fetch chairperson comments";
    const status =
      error instanceof Error && error.message === "Invalid semester filter"
        ? 400
        : isResultsNotReleasedError(error)
        ? 403
        : 500;

    console.error("Chairperson comments API error:", error);
    return NextResponse.json({ message }, { status });
  }
}
