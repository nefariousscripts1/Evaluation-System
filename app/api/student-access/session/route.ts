import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getValidatedStudentAccess } from "@/lib/student-access";

export async function GET() {
  try {
    const access = await getValidatedStudentAccess();

    if (!access) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const submittedTargetIds = await prisma.evaluation.findMany({
      where: {
        evaluatorId: access.student.id,
        scheduleId: access.schedule.id,
      },
      select: {
        evaluatedId: true,
      },
    });

    return NextResponse.json({
      student: access.student,
      schedule: {
        id: access.schedule.id,
        academicYear: access.schedule.academicYear,
        startDate: access.schedule.startDate,
        endDate: access.schedule.endDate,
      },
      submittedTargetIds: submittedTargetIds.map((item) => item.evaluatedId),
    });
  } catch (error) {
    console.error("Student access session error:", error);
    return NextResponse.json({ message: "Failed to load student access session" }, { status: 500 });
  }
}
