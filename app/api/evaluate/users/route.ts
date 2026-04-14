import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAllowedEvaluatedRoles } from "@/lib/role-evaluation";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowedRoles = getAllowedEvaluatedRoles(session.user.role);

  const instructors = await prisma.user.findMany({
    where: { 
      role: { in: allowedRoles },
      deletedAt: null 
    },
    select: { id: true, name: true, email: true, role: true, department: true },
  });
  return NextResponse.json(instructors);
}
