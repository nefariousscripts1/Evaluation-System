import { NextResponse } from "next/server";
import { getCampusDirectorCommentsData } from "@/lib/leadership-portal";
import { getResultsAccessContext } from "@/lib/results-access";
import { isResultsNotReleasedError } from "@/lib/results-release";
import { requireApiSession } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(["campus_director"]);
    const accessContext = getResultsAccessContext(session);

    if (!accessContext) {
      return NextResponse.json({ message: "Invalid session user" }, { status: 401 });
    }

    const data = await getCampusDirectorCommentsData({ request, accessContext });

    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error && error.message === "Invalid semester filter"
        ? error.message
        : isResultsNotReleasedError(error)
        ? error.message
        : "Failed to fetch campus director comments";
    const status =
      error instanceof Error && error.message === "Invalid semester filter"
        ? 400
        : isResultsNotReleasedError(error)
        ? 403
        : 500;

    console.error("Campus director comments API error:", error);
    return NextResponse.json({ message }, { status });
  }
}
