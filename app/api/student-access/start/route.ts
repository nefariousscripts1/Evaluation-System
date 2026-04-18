import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getScheduleByAccessCode } from "@/lib/evaluation-session";
import { setStudentAccessCookie } from "@/lib/student-access";

export async function POST(req: Request) {
  try {
    const { accessCode, portalAccessCode, studentId } = await req.json();
    const normalizedCode = String(accessCode ?? portalAccessCode ?? "").trim().toUpperCase();
    const normalizedStudentId = String(studentId ?? "").trim();

    if (!normalizedCode) {
      return NextResponse.json({ message: "Portal access code is required" }, { status: 400 });
    }

    if (!normalizedStudentId) {
      return NextResponse.json({ message: "Student ID is required" }, { status: 400 });
    }

    const schedule = await getScheduleByAccessCode(normalizedCode);

    if (!schedule) {
      return NextResponse.json(
        { message: "Invalid portal access code" },
        { status: 401 }
      );
    }

    const student = await prisma.user.findFirst({
      where: {
        role: "student",
        studentId: normalizedStudentId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        studentId: true,
      },
    });

    if (!student || !student.studentId) {
      return NextResponse.json({ message: "Student ID not found" }, { status: 404 });
    }

    await setStudentAccessCookie({
      studentUserId: student.id,
      studentId: student.studentId,
      scheduleId: schedule.id,
      instructorId: null,
    });

    return NextResponse.json({
      success: true,
      schedule: {
        id: schedule.id,
        academicYear: schedule.academicYear,
        semester: schedule.semester,
        startDate: schedule.startDate,
        endDate: schedule.endDate,
      },
      student: {
        id: student.id,
        name: student.name,
        studentId: student.studentId,
      },
    });
  } catch (error) {
    console.error("Student access start error:", error);
    return NextResponse.json({ message: "Failed to start student access" }, { status: 500 });
  }
}
