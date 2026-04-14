import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSingleTargetResultsData } from "@/lib/leadership-portal";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "campus_director") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const data = await getSingleTargetResultsData({
      request,
      targetRole: "director",
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Campus director results API error:", error);
    return NextResponse.json(
      { message: "Failed to fetch campus director results" },
      { status: 500 }
    );
  }
}
