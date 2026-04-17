import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getValidatedStudentAccess } from "@/lib/student-access";
import { getAllowedEvaluatedRoles } from "@/lib/role-evaluation";

export async function GET() {
  try {
    const access = await getValidatedStudentAccess();

    if (!access) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const targets = await prisma.user.findMany({
      where: {
        role: { in: getAllowedEvaluatedRoles("student") },
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
  } catch (error) {
    console.error("Student access targets error:", error);
    return NextResponse.json({ message: "Failed to load evaluation targets" }, { status: 500 });
  }
}
