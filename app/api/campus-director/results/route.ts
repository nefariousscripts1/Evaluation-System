import { NextResponse } from "next/server";
import { getCampusDirectorResultsData } from "@/lib/leadership-portal";
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

    const data = await getCampusDirectorResultsData({ request, accessContext });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Campus director results API error:", error);
    if (isResultsNotReleasedError(error)) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { message: "Failed to fetch campus director results" },
      { status: 500 }
    );
  }
}
