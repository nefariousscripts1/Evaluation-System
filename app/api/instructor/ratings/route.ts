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

type SummaryRole = "student" | "chairperson";

function getBreakdown(ratings: number[]) {
  return {
    fiveStar: ratings.filter((rating) => rating === 5).length,
    fourStar: ratings.filter((rating) => rating === 4).length,
    threeStar: ratings.filter((rating) => rating === 3).length,
    twoStar: ratings.filter((rating) => rating === 2).length,
    oneStar: ratings.filter((rating) => rating === 1).length,
  };
}

function formatRoleLabel(role: SummaryRole) {
  return role === "student" ? "Student" : "Chairperson";
}

async function getSummaryForRole(userId: number, academicYear: string, role: SummaryRole) {
  const evaluations = await prisma.evaluation.findMany({
    where: {
      evaluatedId: userId,
      academicYear,
      evaluator: { role },
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
        select: {
          rating: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const ratings = evaluations.flatMap((evaluation) =>
    evaluation.answers.map((answer) => answer.rating)
  );

  const evaluatorName =
    role === "student"
      ? "Students"
      : evaluations[0]?.evaluator.name || evaluations[0]?.evaluator.email || "Chairperson";

  return {
    evaluatorName,
    evaluatorRole: formatRoleLabel(role),
    overallRating:
      ratings.length > 0
        ? Number(
            (
              ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
            ).toFixed(2)
          )
        : 0,
    breakdown: getBreakdown(ratings),
    totalRatings: ratings.length,
  };
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

    const [studentEvaluations, chairpersonEvaluation] = await Promise.all([
      getSummaryForRole(userId, academicYear, "student"),
      getSummaryForRole(userId, academicYear, "chairperson"),
    ]);

    return apiSuccess({
      academicYear,
      years,
      studentEvaluations,
      chairpersonEvaluation,
    });
  } catch (error) {
    if (isResultsNotReleasedError(error)) {
      return apiError(error.message, 403);
    }

    return handleApiError(error, "Failed to fetch instructor ratings");
  }
}
