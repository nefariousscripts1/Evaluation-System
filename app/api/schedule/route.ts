import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import {
  closeAllActiveSchedules,
  generateAccessCode,
  getActiveSchedule,
  isValidSemester,
} from "@/lib/evaluation-session";
import { ensureInstructorAccessCodesForSchedule } from "@/lib/instructor-access";

async function getScheduleSnapshot() {
  const [activeSchedule, recentSchedules] = await Promise.all([
    getActiveSchedule(),
    prisma.schedule.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        academicYear: true,
        semester: true,
        startDate: true,
        endDate: true,
        isOpen: true,
        accessCode: true,
        createdAt: true,
      },
    }),
  ]);

  const submittedStudentIds = activeSchedule
    ? await prisma.evaluation.findMany({
        where: {
          scheduleId: activeSchedule.id,
          evaluator: { role: "student" },
        },
        distinct: ["evaluatorId"],
        select: {
          evaluator: {
            select: {
              id: true,
              studentId: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return {
    activeSchedule,
    recentSchedules,
    submissionCount: submittedStudentIds.length,
    submittedStudentIds: submittedStudentIds
      .map((item) => item.evaluator.studentId || `Anonymous Session ${item.evaluator.id}`),
  };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "secretary") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(await getScheduleSnapshot());
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "secretary") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { academicYear, semester, startDate, endDate, isOpen, scheduleId } = await req.json();

  const parsedStartDate = new Date(startDate);
  const parsedEndDate = new Date(endDate);
  const normalizedAcademicYear = String(academicYear ?? "").trim();
  const normalizedSemester = String(semester ?? "").trim();

  if (Number.isNaN(parsedStartDate.getTime()) || Number.isNaN(parsedEndDate.getTime())) {
    return NextResponse.json({ error: "Invalid schedule dates" }, { status: 400 });
  }

  if (!normalizedAcademicYear) {
    return NextResponse.json({ error: "Academic Year is required" }, { status: 400 });
  }

  if (!isValidSemester(normalizedSemester)) {
    return NextResponse.json({ error: "Invalid semester" }, { status: 400 });
  }

  if (parsedEndDate < parsedStartDate) {
    return NextResponse.json(
      { error: "End date must be on or after the start date" },
      { status: 400 }
    );
  }

  const activeSchedule = await getActiveSchedule();

  if (isOpen) {
    let persistedSchedule;
    const shouldUpdateCurrentSchedule =
      activeSchedule &&
      Number(scheduleId) === activeSchedule.id &&
      activeSchedule.academicYear === normalizedAcademicYear &&
      activeSchedule.semester === normalizedSemester;

    if (shouldUpdateCurrentSchedule) {
      persistedSchedule = await prisma.schedule.update({
        where: { id: activeSchedule.id },
        data: {
          academicYear: normalizedAcademicYear,
          semester: normalizedSemester,
          startDate: parsedStartDate,
          endDate: parsedEndDate,
          isOpen: true,
          accessCode: activeSchedule.accessCode || generateAccessCode(8),
        },
      });
    } else {
      await closeAllActiveSchedules();

      persistedSchedule = await prisma.schedule.create({
        data: {
          academicYear: normalizedAcademicYear,
          semester: normalizedSemester,
          startDate: parsedStartDate,
          endDate: parsedEndDate,
          isOpen: true,
          accessCode: generateAccessCode(8),
        },
      });
    }

    await ensureInstructorAccessCodesForSchedule(persistedSchedule.id);

    return NextResponse.json({
      message: "Evaluation session is now open",
      schedule: persistedSchedule,
      ...(await getScheduleSnapshot()),
    });
  }

  const scheduleToCloseId =
    Number.isInteger(Number(scheduleId)) && Number(scheduleId) > 0
      ? Number(scheduleId)
      : activeSchedule?.id;

  if (scheduleToCloseId) {
    await prisma.schedule.update({
      where: { id: scheduleToCloseId },
      data: { isOpen: false },
    });
  }

  return NextResponse.json({
    message: "Evaluation session has been closed",
    ...(await getScheduleSnapshot()),
  });
}
