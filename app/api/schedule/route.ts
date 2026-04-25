import prisma from "@/lib/db";
import {
  apiError,
  apiSuccess,
  handleApiError,
  parseJsonBody,
  parseSearchParams,
} from "@/lib/api";
import {
  closeAllActiveSchedules,
  generateAccessCode,
  getActiveSchedule,
} from "@/lib/evaluation-session";
import { ensureInstructorAccessCodesForSchedule } from "@/lib/instructor-access";
import { sendEvaluationOpenAnnouncement } from "@/lib/mailer";
import { requireApiSession } from "@/lib/server-auth";
import {
  scheduleDeleteQuerySchema,
  scheduleMutationSchema,
} from "@/lib/validation";

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
    await requireApiSession(["secretary"]);
    const snapshot = await getScheduleSnapshot();
    return apiSuccess(snapshot);
  } catch (error) {
    return handleApiError(error, "Failed to load schedule");
  }
}

export async function POST(req: Request) {
  try {
    await requireApiSession(["secretary"]);
    const { academicYear, semester, startDate, endDate, isOpen, scheduleId } =
      await parseJsonBody(req, scheduleMutationSchema);

    const activeSchedule = await getActiveSchedule();

    if (isOpen) {
      let persistedSchedule;
      const shouldUpdateCurrentSchedule =
        activeSchedule &&
        scheduleId === activeSchedule.id &&
        activeSchedule.academicYear === academicYear &&
        activeSchedule.semester === semester;

      if (shouldUpdateCurrentSchedule) {
        persistedSchedule = await prisma.schedule.update({
          where: { id: activeSchedule.id },
          data: {
            academicYear,
            semester,
            startDate,
            endDate,
            isOpen: true,
            accessCode: activeSchedule.accessCode || generateAccessCode(8),
          },
        });
      } else {
        await closeAllActiveSchedules();

        persistedSchedule = await prisma.schedule.create({
          data: {
            academicYear,
            semester,
            startDate,
            endDate,
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
            recipients: Array.from(
              new Set(recipients.map((user) => user.email.trim()).filter(Boolean))
            ),
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

      return apiSuccess({
        message: "Evaluation session is now open",
        schedule: persistedSchedule,
        announcement,
        ...(await getScheduleSnapshot()),
      });
    }

    const scheduleToCloseId =
      typeof scheduleId === "number" && scheduleId > 0 ? scheduleId : activeSchedule?.id;

    if (scheduleToCloseId) {
      await prisma.schedule.update({
        where: { id: scheduleToCloseId },
        data: { isOpen: false },
      });
    }

    return apiSuccess({
      message: "Evaluation session has been closed",
      ...(await getScheduleSnapshot()),
    });
  } catch (error) {
    return handleApiError(error, "Failed to save schedule");
  }
}

export async function DELETE(req: Request) {
  try {
    await requireApiSession(["secretary"]);
    const { id: scheduleId } = parseSearchParams(req, scheduleDeleteQuerySchema);

    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      select: {
        id: true,
        isOpen: true,
        _count: {
          select: {
            evaluations: true,
            instructorAccessCodes: true,
          },
        },
      },
    });

    if (!schedule) {
      return apiError("Schedule not found", 404);
    }

    if (schedule.isOpen) {
      return apiError("Close the active session before deleting it", 400);
    }

    if (schedule._count.evaluations > 0) {
      return apiError(
        "This session cannot be deleted because evaluation records already exist",
        400
      );
    }

    await prisma.$transaction([
      prisma.instructorAccessCode.deleteMany({
        where: { scheduleId },
      }),
      prisma.schedule.delete({
        where: { id: scheduleId },
      }),
    ]);

    return apiSuccess({
      message: "Session deleted successfully",
      ...(await getScheduleSnapshot()),
    });
  } catch (error) {
    return handleApiError(error, "Failed to delete session");
  }
}
