import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import {
  closeAllActiveSchedules,
  generateAccessCode,
  getAcademicYearForDate,
  getActiveSchedule,
} from "@/lib/evaluation-session";

async function getScheduleSnapshot() {
  const [activeSchedule, recentSchedules] = await Promise.all([
    getActiveSchedule(),
    prisma.schedule.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        academicYear: true,
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
      .map((item) => item.evaluator.studentId)
      .filter((studentId): studentId is string => Boolean(studentId)),
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

  const { startDate, endDate, isOpen, scheduleId } = await req.json();

  const parsedStartDate = new Date(startDate);
  const parsedEndDate = new Date(endDate);

  if (Number.isNaN(parsedStartDate.getTime()) || Number.isNaN(parsedEndDate.getTime())) {
    return NextResponse.json({ error: "Invalid schedule dates" }, { status: 400 });
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

    if (activeSchedule && Number(scheduleId) === activeSchedule.id) {
      persistedSchedule = await prisma.schedule.update({
        where: { id: activeSchedule.id },
        data: {
          academicYear: getAcademicYearForDate(parsedStartDate),
          startDate: parsedStartDate,
          endDate: parsedEndDate,
          isOpen: true,
        },
      });
    } else {
      await closeAllActiveSchedules();

      persistedSchedule = await prisma.schedule.create({
        data: {
          academicYear: getAcademicYearForDate(parsedStartDate),
          startDate: parsedStartDate,
          endDate: parsedEndDate,
          isOpen: true,
          accessCode: generateAccessCode(),
        },
      });
    }

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
