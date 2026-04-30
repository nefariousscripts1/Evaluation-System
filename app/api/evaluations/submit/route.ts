import { ApiRouteError, apiError, apiSuccess, handleApiError, parseJsonBody } from "@/lib/api";
import {
  EvaluationSubmissionError,
  submitEvaluationRecord,
} from "@/lib/evaluation-submission";
import { getAllowedEvaluatedRoles } from "@/lib/role-evaluation";
import { requireApiUserId } from "@/lib/server-auth";
import { evaluationSubmissionSchema } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const { session, userId } = await requireApiUserId();
    const evaluatorRole = session.user.role ?? "";

    if (getAllowedEvaluatedRoles(evaluatorRole).length === 0) {
      throw new ApiRouteError("Unauthorized", { status: 401 });
    }

    const payload = await parseJsonBody(req, evaluationSubmissionSchema);
    const evaluation = await submitEvaluationRecord({
      evaluatorId: userId,
      evaluatorRole,
      evaluatedId: payload.evaluatedId,
      scheduleId: payload.scheduleId,
      academicYear: payload.academicYear,
      semester: payload.semester,
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
