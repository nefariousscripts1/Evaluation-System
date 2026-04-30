import prisma from "@/lib/db";
import { ApiRouteError, apiError, apiSuccess, handleApiError, parseJsonBody } from "@/lib/api";
import { findInstructorAccessByCode } from "@/lib/instructor-access";
import {
  getStudentAccessPayload,
  getValidatedStudentAccess,
  setStudentAccessCookie,
} from "@/lib/student-access";
import { instructorCodeSchema } from "@/lib/validation";

export async function GET() {
  try {
    const access = await getValidatedStudentAccess();

    if (!access) {
      return apiError("Unauthorized", 401);
    }

    return apiSuccess({
      target: access.target,
      hasSubmittedCurrentTarget: access.target
        ? Boolean(
            await prisma.evaluation.findFirst({
              where: {
                evaluatorId: access.student.id,
                evaluatedId: access.target.id,
                academicYear: access.schedule.academicYear,
                semester: access.schedule.semester,
              },
              select: { id: true },
            })
          )
        : false,
    });
  } catch (error) {
    return handleApiError(error, "Failed to load evaluation target");
  }
}

export async function POST(req: Request) {
  try {
    const access = await getValidatedStudentAccess();

    if (!access) {
      return apiError("Unauthorized", 401);
    }

    const { instructorCode } = await parseJsonBody(req, instructorCodeSchema);
    const instructorAccess = await findInstructorAccessByCode(access.schedule.id, instructorCode);

    if (!instructorAccess) {
      throw new ApiRouteError("Invalid instructor code", { status: 401 });
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
        academicYear: access.schedule.academicYear,
        semester: access.schedule.semester,
      },
      select: { id: true },
    });

    return apiSuccess({
      target: instructorAccess.instructor,
      code: instructorAccess.code,
      hasSubmittedCurrentTarget: Boolean(existingEvaluation),
    });
  } catch (error) {
    return handleApiError(error, "Failed to validate instructor code");
  }
}

export async function DELETE() {
  try {
    const payload = await getStudentAccessPayload();

    if (!payload) {
      return apiError("Unauthorized", 401);
    }

    await setStudentAccessCookie({
      studentUserId: payload.studentUserId,
      studentId: payload.studentId,
      scheduleId: payload.scheduleId,
      instructorId: null,
    });

    return apiSuccess({ reset: true });
  } catch (error) {
    return handleApiError(error, "Failed to reset instructor selection");
  }
}
