import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import {
  campusDirectorEvaluatedRoles,
  getReportableRoleLabel,
  isCampusDirectorRoleFilter,
} from "@/lib/reporting-roles";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "campus_director") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestedRole = searchParams.get("role")?.trim().toLowerCase() ?? "all";
    const roleFilter = isCampusDirectorRoleFilter(requestedRole) ? requestedRole : "all";
    const roles = roleFilter === "all" ? [...campusDirectorEvaluatedRoles] : [roleFilter];

    const targets = await prisma.user.findMany({
      where: {
        role: { in: roles },
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
      },
      orderBy: [{ role: "asc" }, { name: "asc" }, { email: "asc" }],
    });

    const roleOrder = new Map<string, number>(
      campusDirectorEvaluatedRoles.map((role, index) => [role, index])
    );

    const sortedTargets = targets.sort((left, right) => {
      const leftRoleOrder = roleOrder.get(left.role) ?? Number.MAX_SAFE_INTEGER;
      const rightRoleOrder = roleOrder.get(right.role) ?? Number.MAX_SAFE_INTEGER;

      if (leftRoleOrder !== rightRoleOrder) {
        return leftRoleOrder - rightRoleOrder;
      }

      return (left.name || left.email).localeCompare(right.name || right.email);
    });

    return NextResponse.json(
      sortedTargets.map((target) => ({
        id: target.id,
        name: target.name,
        email: target.email,
        role: target.role,
        department: target.department,
        roleLabel: getReportableRoleLabel(target.role),
      }))
    );
  } catch (error) {
    console.error("Campus director targets API error:", error);
    return NextResponse.json({ message: "Failed to fetch campus director targets" }, { status: 500 });
  }
}
