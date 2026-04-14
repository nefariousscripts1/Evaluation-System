import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getLeadershipCommentsData } from "@/lib/leadership-portal";

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

    const data = await getLeadershipCommentsData({
      request,
      sessionUserId: directorId,
      targetRole: "dean",
      targetLabel: "Dean",
    });

    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error && error.message === "Invalid semester filter"
        ? error.message
        : "Failed to fetch director comments";
    const status =
      error instanceof Error && error.message === "Invalid semester filter" ? 400 : 500;

    console.error("Director comments API error:", error);
    return NextResponse.json({ message }, { status });
  }
}
