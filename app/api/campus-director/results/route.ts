import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCampusDirectorResultsData } from "@/lib/leadership-portal";
import { isResultsNotReleasedError } from "@/lib/results-release";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "campus_director") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const data = await getCampusDirectorResultsData({ request });

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
