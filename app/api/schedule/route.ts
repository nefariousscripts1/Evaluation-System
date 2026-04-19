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
import { sendEvaluationOpenAnnouncement } from "@/lib/mailer";

async function getScheduleSnapshot() {
  const [activeScheduleResult, recentSchedulesResult] = await Promise.allSettled([
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

  if (activeScheduleResult.status === "rejected") {
    console.error("Schedule snapshot active schedule lookup failed:", activeScheduleResult.reason);
  }

  if (recentSchedulesResult.status === "rejected") {
    console.error("Schedule snapshot recent schedules lookup failed:", recentSchedulesResult.reason);
  }

  const activeSchedule =
    activeScheduleResult.status === "fulfilled" ? activeScheduleResult.value : null;
  const recentSchedules =
    recentSchedulesResult.status === "fulfilled" ? recentSchedulesResult.value : [];

  const submittedStudentIds = activeSchedule
    ? await prisma.evaluation
        .findMany({
          where: {
            scheduleId: activeSchedule.id,
            evaluator: { role: "student" },
          },
          select: {
            evaluator: {
              select: {
                id: true,
                studentId: true,
              },
            },
          },
        })
        .catch((error) => {
          console.error("Schedule snapshot submission lookup failed:", error);
          return [];
        })
    : [];

  const uniqueSubmittedStudentIds = new Map<number, string>();
  for (const item of submittedStudentIds) {
    const evaluatorId = item.evaluator.id;
    if (!uniqueSubmittedStudentIds.has(evaluatorId)) {
      uniqueSubmittedStudentIds.set(
        evaluatorId,
        item.evaluator.studentId || `Anonymous Session ${item.evaluator.id}`
      );
    }
  }

  return {
    activeSchedule,
    recentSchedules,
    submissionCount: uniqueSubmittedStudentIds.size,
    submittedStudentIds: Array.from(uniqueSubmittedStudentIds.values()),
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    console.log("API /schedule session:", !!session, session?.user?.role);
    if (!session || session.user.role !== "secretary") {
      return NextResponse.json({ error: "Secretary access required" }, { status: 401 });
    }

    const snapshot = await getScheduleSnapshot().catch((error) => {
      console.error("Schedule snapshot build failed:", error);
      return {
        activeSchedule: null,
        recentSchedules: [],
        submissionCount: 0,
        submittedStudentIds: [],
      };
    });
    return NextResponse.json(snapshot);
  } catch (error) {
    console.error("Schedule API error:", error);
    return NextResponse.json(
      {
        error: "Server error loading schedule",
        activeSchedule: null,
        recentSchedules: [],
        submissionCount: 0,
        submittedStudentIds: [],
      },
      { status: 200 }
    );
  }
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

    let announcement:
      | {
          delivered: boolean;
          provider: string;
          recipientCount: number;
        }
      | undefined;

    if (!shouldUpdateCurrentSchedule) {
      try {
        const recipients = await prisma.user.findMany({
          where: {
            deletedAt: null,
            role: { not: "secretary" },
            email: { not: "" },
          },
          select: { email: true },
        });

        announcement = await sendEvaluationOpenAnnouncement({
          recipients: Array.from(new Set(recipients.map((user) => user.email.trim()).filter(Boolean))),
          academicYear: persistedSchedule.academicYear,
          semester: persistedSchedule.semester,
          startDate: persistedSchedule.startDate,
          endDate: persistedSchedule.endDate,
        });
      } catch (error) {
        console.error("Evaluation-open announcement failed:", error);
        announcement = {
          delivered: false,
          provider: "failed",
          recipientCount: 0,
        };
      }
    }

    return NextResponse.json({
      message: "Evaluation session is now open",
      schedule: persistedSchedule,
      announcement,
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
