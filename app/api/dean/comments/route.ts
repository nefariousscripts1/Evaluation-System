import { NextResponse } from "next/server";
import { getLeadershipCommentsData } from "@/lib/leadership-portal";
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

    const data = await getLeadershipCommentsData({
      request,
      sessionUserId: deanId,
      targetRole: "chairperson",
      targetLabel: "Chairperson",
      accessContext,
    });

    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error && error.message === "Invalid semester filter"
        ? error.message
        : isResultsNotReleasedError(error)
        ? error.message
        : "Failed to fetch dean comments";
    const status =
      error instanceof Error && error.message === "Invalid semester filter"
        ? 400
        : isResultsNotReleasedError(error)
        ? 403
        : 500;

    console.error("Dean comments API error:", error);
    return NextResponse.json({ message }, { status });
  }
}
