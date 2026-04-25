import prisma from "@/lib/db";
import { apiError, apiSuccess, handleApiError, parseSearchParams } from "@/lib/api";
import { requireApiUserId } from "@/lib/server-auth";
import { yearQuerySchema } from "@/lib/validation";
import {
  ResultsNotReleasedError,
  assertResultsReleasedForAcademicYear,
  filterReleasedAcademicYears,
  isResultsNotReleasedError,
} from "@/lib/results-release";

export const dynamic = "force-dynamic";

function formatRoleLabel(role: string) {
  switch (role) {
    case "chairperson":
      return "Chairperson";
    case "campus_director":
      return "Campus Director";
    default:
      return role.charAt(0).toUpperCase() + role.slice(1);
  }
}

export async function GET(request: Request) {
  try {
    const { userId } = await requireApiUserId(["faculty"]);

    const yearsData = await prisma.evaluation.findMany({
      where: { evaluatedId: userId },
      distinct: ["academicYear"],
      select: { academicYear: true },
      orderBy: { academicYear: "desc" },
    });

    const years = await filterReleasedAcademicYears(yearsData.map((item) => item.academicYear));
    const { year: requestedYear } = parseSearchParams(request, yearQuerySchema);
    const academicYear = requestedYear && years.includes(requestedYear) ? requestedYear : years[0];

    if (!academicYear) {
      throw new ResultsNotReleasedError(requestedYear || undefined);
    }

    await assertResultsReleasedForAcademicYear(academicYear);

    const evaluations = await prisma.evaluation.findMany({
      where: {
        evaluatedId: userId,
        academicYear,
      },
      include: {
        evaluator: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
        answers: {
          where: { comment: { not: null } },
          select: {
            id: true,
            comment: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const comments = evaluations.flatMap((evaluation) => {
      const items: Array<{
        id: number;
        comment: string;
        academicYear: string;
        evaluatorName: string;
        evaluatorRole: string;
      }> = [];

      const evaluatorName = evaluation.evaluator.name || evaluation.evaluator.email || "Evaluator";
      const evaluatorRole = formatRoleLabel(evaluation.evaluator.role);

      if (evaluation.generalComment?.trim()) {
        items.push({
          id: evaluation.id * 1000,
          comment: evaluation.generalComment.trim(),
          academicYear: evaluation.academicYear,
          evaluatorName,
          evaluatorRole,
        });
      }

      for (const answer of evaluation.answers) {
        if (answer.comment?.trim()) {
          items.push({
            id: answer.id,
            comment: answer.comment.trim(),
            academicYear: evaluation.academicYear,
            evaluatorName,
            evaluatorRole,
          });
        }
      }

      return items;
    });

    return apiSuccess({
      academicYear,
      years,
      comments,
    });
  } catch (error) {
    if (isResultsNotReleasedError(error)) {
      return apiError(error.message, 403);
    }

    return handleApiError(error, "Failed to fetch instructor comments");
  }
}
