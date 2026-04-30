import prisma from "@/lib/db";
import { SEMESTER_OPTIONS } from "@/lib/evaluation-session";
import { apiSuccess, handleApiError, parseSearchParams } from "@/lib/api";
import { campusDirectorEvaluatedRoles } from "@/lib/reporting-roles";
import { requireApiSession } from "@/lib/server-auth";
import {
  buildAccessibleResultsUserWhere,
  getResultsAccessContext,
  resultsViewerRoles,
} from "@/lib/results-access";
import { reportsQuerySchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(resultsViewerRoles);
    const accessContext = getResultsAccessContext(session);
    const { academicYear, semester, role } = parseSearchParams(request, reportsQuerySchema);

    if (!accessContext) {
      return apiSuccess({
        results: [],
        years: [],
        semesters: SEMESTER_OPTIONS,
        role: "all",
        completedCount: 0,
        totalCount: 0,
      });
    }

    const visibleRoles =
      role === "all" ? [...campusDirectorEvaluatedRoles] : [role];
    const accessibleUsersWhere = buildAccessibleResultsUserWhere(accessContext, {
      includeOwn: false,
      includeSubordinate: true,
      restrictToRoles: visibleRoles,
    });
    const evaluationWhere = {
      ...(academicYear ? { academicYear } : {}),
      ...(semester ? { semester } : {}),
    };

    const [users, totalInstructorCount, yearsData] = await Promise.all([
      prisma.user.findMany({
        where: {
          ...accessibleUsersWhere,
          evaluationsReceived: {
            some: evaluationWhere,
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
          evaluationsReceived: {
            where: evaluationWhere,
            select: {
              id: true,
              academicYear: true,
              semester: true,
              answers: {
                select: {
                  rating: true,
                },
              },
            },
          },
        },
        orderBy: [{ role: "asc" }, { name: "asc" }, { email: "asc" }],
      }),
      prisma.user.count({
        where: accessibleUsersWhere,
      }),
      prisma.evaluation.findMany({
        where: {
          evaluated: accessibleUsersWhere,
        },
        distinct: ["academicYear"],
        select: { academicYear: true },
        orderBy: { academicYear: "desc" },
      }),
    ]);

    const results = users
      .map((user) => {
        const ratings = user.evaluationsReceived.flatMap((evaluation) =>
          evaluation.answers.map((answer) => answer.rating)
        );

        const averageRating =
          ratings.length > 0
            ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
            : 0;

        return {
          id: user.id,
          instructor_id: user.id,
          instructor_name: user.name || user.email,
          instructor_role: user.role,
          department_id: user.department ?? null,
          college_id: user.department ?? null,
          academic_year: academicYear || user.evaluationsReceived[0]?.academicYear || "",
          semester: semester || user.evaluationsReceived[0]?.semester || "",
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
          },
          academicYear: academicYear || user.evaluationsReceived[0]?.academicYear || "",
          averageRating: Number(averageRating.toFixed(2)),
        };
      })
      .sort((left, right) => right.averageRating - left.averageRating);

    return apiSuccess({
      viewerRole: accessContext.role,
      role,
      results,
      years: yearsData.map((item) => item.academicYear),
      semesters: SEMESTER_OPTIONS,
      completedCount: results.length,
      totalCount: totalInstructorCount,
    });
  } catch (error) {
    return handleApiError(error, "Failed to fetch reports");
  }
}
