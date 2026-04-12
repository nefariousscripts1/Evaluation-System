import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { getAllowedEvaluatedRoles } from "@/lib/role-evaluation";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const allowedRoles = getAllowedEvaluatedRoles(session.user.role ?? "");

  if (allowedRoles.length === 0) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const targets = await prisma.user.findMany({
    where: {
      role: { in: allowedRoles },
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(targets);
}
