import prisma from "@/lib/db";
import { ApiRouteError, apiSuccess, handleApiError, parseJsonBody } from "@/lib/api";
import { getScheduleByAccessCode } from "@/lib/evaluation-session";
import { setStudentAccessCookie } from "@/lib/student-access";
import { studentAccessStartSchema } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const { accessCode, studentId } = await parseJsonBody(req, studentAccessStartSchema);
    const schedule = await getScheduleByAccessCode(accessCode);

    if (!schedule) {
      throw new ApiRouteError("Invalid portal access code", { status: 401 });
    }

    const student = await prisma.user.findFirst({
      where: {
        role: "student",
        studentId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        studentId: true,
      },
    });

    if (!student || !student.studentId) {
      throw new ApiRouteError("Student ID not found", { status: 404 });
    }

    await setStudentAccessCookie({
      studentUserId: student.id,
      studentId: student.studentId,
      scheduleId: schedule.id,
      instructorId: null,
    });

    return apiSuccess({
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
    return handleApiError(error, "Failed to start student access");
  }
}
