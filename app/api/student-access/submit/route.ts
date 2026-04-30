import { apiError, apiSuccess, handleApiError, parseJsonBody } from "@/lib/api";
import {
  EvaluationSubmissionError,
  submitEvaluationRecord,
} from "@/lib/evaluation-submission";
import { getValidatedStudentAccess } from "@/lib/student-access";
import { evaluationFeedbackSchema } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const access = await getValidatedStudentAccess();

    if (!access) {
      return apiError("Unauthorized", 401);
    }

    if (!access.target) {
      return apiError("Instructor code validation is required", 400);
    }

    const payload = await parseJsonBody(req, evaluationFeedbackSchema);
    const evaluation = await submitEvaluationRecord({
      evaluatorId: access.student.id,
      evaluatorRole: "student",
      evaluatedId: access.target.id,
      scheduleId: access.schedule.id,
      academicYear: access.schedule.academicYear,
      semester: access.schedule.semester,
      answers: payload.answers,
      comment: payload.comment,
    });

    return apiSuccess({ evaluation }, { status: 201 });
  } catch (error) {
    if (error instanceof EvaluationSubmissionError) {
      return apiError(
        error.message,
        error.status,
        process.env.NODE_ENV !== "production" && error.details
          ? { details: error.details }
          : undefined
      );
    }

    return handleApiError(error, "Failed to submit evaluation");
  }
}
