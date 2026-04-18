import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { findInstructorAccessByCode } from "@/lib/instructor-access";
import {
  getStudentAccessPayload,
  getValidatedStudentAccess,
  setStudentAccessCookie,
} from "@/lib/student-access";

export async function GET() {
  try {
    const access = await getValidatedStudentAccess();

    if (!access) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      target: access.target,
      hasSubmittedCurrentTarget: access.target
        ? Boolean(
            await prisma.evaluation.findFirst({
              where: {
                evaluatorId: access.student.id,
                evaluatedId: access.target.id,
                scheduleId: access.schedule.id,
              },
              select: { id: true },
            })
          )
        : false,
    });
  } catch (error) {
    console.error("Student access targets error:", error);
    return NextResponse.json({ message: "Failed to load evaluation target" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const access = await getValidatedStudentAccess();

    if (!access) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { instructorCode } = await req.json();
    const normalizedCode = String(instructorCode ?? "").trim().toUpperCase();

    if (!normalizedCode) {
      return NextResponse.json({ message: "Instructor code is required" }, { status: 400 });
    }

    const instructorAccess = await findInstructorAccessByCode(access.schedule.id, normalizedCode);

    if (!instructorAccess) {
      return NextResponse.json({ message: "Invalid instructor code" }, { status: 401 });
    }

    await setStudentAccessCookie({
      studentUserId: access.student.id,
      studentId: access.student.studentId,
      scheduleId: access.schedule.id,
      instructorId: instructorAccess.instructor.id,
    });

    const existingEvaluation = await prisma.evaluation.findFirst({
      where: {
        evaluatorId: access.student.id,
        evaluatedId: instructorAccess.instructor.id,
        scheduleId: access.schedule.id,
      },
      select: { id: true },
    });

    return NextResponse.json({
      target: instructorAccess.instructor,
      code: instructorAccess.code,
      hasSubmittedCurrentTarget: Boolean(existingEvaluation),
    });
  } catch (error) {
    console.error("Student access target validation error:", error);
    return NextResponse.json({ message: "Failed to validate instructor code" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const payload = await getStudentAccessPayload();

    if (!payload) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await setStudentAccessCookie({
      studentUserId: payload.studentUserId,
      studentId: payload.studentId,
      scheduleId: payload.scheduleId,
      instructorId: null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Student access target reset error:", error);
    return NextResponse.json({ message: "Failed to reset instructor selection" }, { status: 500 });
  }
}
