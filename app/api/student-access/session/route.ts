import prisma from "@/lib/db";
import { apiError, apiSuccess, handleApiError } from "@/lib/api";
import { getValidatedStudentAccess } from "@/lib/student-access";

export async function GET() {
  try {
    const access = await getValidatedStudentAccess();

    if (!access) {
      return apiError("Unauthorized", 401);
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

    return apiSuccess({
      student: access.student,
      schedule: {
        id: access.schedule.id,
        academicYear: access.schedule.academicYear,
        semester: access.schedule.semester,
        startDate: access.schedule.startDate,
        endDate: access.schedule.endDate,
        accessCode: access.schedule.accessCode,
      },
      target: access.target,
      hasSubmittedCurrentTarget: submittedTargetIds.some(
        (item) => item.evaluatedId === access.target?.id
      ),
      submittedTargetIds: submittedTargetIds.map((item) => item.evaluatedId),
    });
  } catch (error) {
    return handleApiError(error, "Failed to load student access session");
  }
}
