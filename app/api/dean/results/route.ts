import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getLeadershipResultsData } from "@/lib/leadership-portal";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "dean") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const deanId = Number.parseInt(session.user.id ?? "", 10);
    if (!Number.isInteger(deanId)) {
      return NextResponse.json({ message: "Invalid session user" }, { status: 401 });
    }

    const data = await getLeadershipResultsData({
      request,
      sessionUserId: deanId,
      sessionUserName: session.user.name,
      sessionUserEmail: session.user.email,
      viewerRoleLabel: "Dean",
      targetRole: "chairperson",
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Dean results API error:", error);
    return NextResponse.json({ message: "Failed to fetch dean results" }, { status: 500 });
  }
}
