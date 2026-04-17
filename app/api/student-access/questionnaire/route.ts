import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getValidatedStudentAccess } from "@/lib/student-access";

export async function GET() {
  try {
    const access = await getValidatedStudentAccess();

    if (!access) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const questions = await prisma.questionnaire.findMany({
      where: { isActive: true },
      orderBy: [{ category: "asc" }, { id: "asc" }],
    });

    return NextResponse.json(questions);
  } catch (error) {
    console.error("Student questionnaire error:", error);
    return NextResponse.json({ message: "Failed to load questionnaire" }, { status: 500 });
  }
}
