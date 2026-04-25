import { apiError, apiSuccess, handleApiError, parseJsonBody } from "@/lib/api";
import { requireApiUserId } from "@/lib/server-auth";
import { evaluationSubmissionSchema } from "@/lib/validation";
import {
  EvaluationSubmissionError,
  submitEvaluationRecord,
} from "@/lib/evaluation-submission";

export async function POST(req: Request) {
  try {
    const { session, userId: evaluatorId } = await requireApiUserId(["student"]);
    const payload = await parseJsonBody(req, evaluationSubmissionSchema);

    const evaluation = await submitEvaluationRecord({
      evaluatorId,
      evaluatorRole: session.user.role,
      evaluatedId: payload.evaluatedId,
      scheduleId: payload.scheduleId,
      academicYear: payload.academicYear,
      answers: payload.answers,
      comment: payload.comment,
    });

    return apiSuccess({ evaluation }, { status: 201 });
  } catch (error) {
    if (error instanceof EvaluationSubmissionError) {
      return apiError(error.message, error.status);
    }

    return handleApiError(error, "Failed to submit evaluation");
  }
}
