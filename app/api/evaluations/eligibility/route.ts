import { ApiRouteError, apiError, apiSuccess, handleApiError, parseSearchParams } from "@/lib/api";
import {
  assertEvaluationCanBeStarted,
  EvaluationSubmissionError,
} from "@/lib/evaluation-submission";
import { getAllowedEvaluatedRoles } from "@/lib/role-evaluation";
import { requireApiUserId } from "@/lib/server-auth";
import { evaluationEligibilityQuerySchema } from "@/lib/validation";

export async function GET(req: Request) {
  try {
    const { session, userId } = await requireApiUserId();
    const evaluatorRole = session.user.role ?? "";

    if (getAllowedEvaluatedRoles(evaluatorRole).length === 0) {
      throw new ApiRouteError("Unauthorized", { status: 401 });
    }

    const query = parseSearchParams(req, evaluationEligibilityQuerySchema);
    const period = await assertEvaluationCanBeStarted({
      evaluatorId: userId,
      evaluatorRole,
      evaluatedId: query.evaluatedId,
      scheduleId: query.scheduleId,
      academicYear: query.academicYear,
      semester: query.semester,
    });

    return apiSuccess({
      canEvaluate: true,
      ...period,
    });
  } catch (error) {
    if (error instanceof EvaluationSubmissionError) {
      return apiError(error.message, error.status);
    }

    return handleApiError(error, "Failed to validate evaluation setup");
  }
}
