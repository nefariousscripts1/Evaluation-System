import prisma from "@/lib/db";
import { SEMESTER_OPTIONS } from "@/lib/evaluation-session";
import { apiSuccess, handleApiError, parseSearchParams } from "@/lib/api";
import { requireApiSession } from "@/lib/server-auth";
import { reportsQuerySchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireApiSession(["secretary"]);
    const { academicYear, semester } = parseSearchParams(request, reportsQuerySchema);

    const where = {
      ...(academicYear ? { academicYear } : {}),
      ...(semester ? { semester } : {}),
    };

    const users = await prisma.user.findMany({
      where: {
        role: {
          in: ["faculty", "chairperson", "dean", "director", "campus_director"],
        },
        deletedAt: null,
        evaluationsReceived: {
          some: where,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        evaluationsReceived: {
          where,
          select: {
            id: true,
            academicYear: true,
            answers: {
              select: {
                rating: true,
              },
            },
          },
        },
      },
    });

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
          user: {
            name: user.name,
            email: user.email,
            role: user.role,
          },
          academicYear: academicYear || user.evaluationsReceived[0]?.academicYear || "",
          averageRating,
        };
      })
      .sort((left, right) => right.averageRating - left.averageRating);

    const yearsData = await prisma.evaluation.findMany({
      distinct: ["academicYear"],
      select: { academicYear: true },
      orderBy: { academicYear: "desc" },
    });

    return apiSuccess({
      results,
      years: yearsData.map((item) => item.academicYear),
      semesters: SEMESTER_OPTIONS,
    });
  } catch (error) {
    return handleApiError(error, "Failed to fetch reports");
  }
}
