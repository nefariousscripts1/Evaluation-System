import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

type RatingBreakdown = {
  fiveStar: number;
  fourStar: number;
  threeStar: number;
  twoStar: number;
  oneStar: number;
};

function fallbackAcademicYear() {
  const year = new Date().getFullYear();
  return `${year}-${year + 1}`;
}

function buildBreakdown(ratings: number[]): RatingBreakdown {
  return {
    fiveStar: ratings.filter((rating) => rating === 5).length,
    fourStar: ratings.filter((rating) => rating === 4).length,
    threeStar: ratings.filter((rating) => rating === 3).length,
    twoStar: ratings.filter((rating) => rating === 2).length,
    oneStar: ratings.filter((rating) => rating === 1).length,
  };
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "chairperson") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const chairpersonId = Number.parseInt(session.user.id ?? "", 10);
    if (!Number.isInteger(chairpersonId)) {
      return NextResponse.json({ message: "Invalid session user" }, { status: 401 });
    }

    const yearsFromResults = await prisma.result.findMany({
      distinct: ["academicYear"],
      select: { academicYear: true },
      orderBy: { academicYear: "desc" },
    });

    const yearsFromEvaluations = await prisma.evaluation.findMany({
      distinct: ["academicYear"],
      select: { academicYear: true },
      orderBy: { academicYear: "desc" },
    });

    const years = Array.from(
      new Set([
        ...yearsFromResults.map((item) => item.academicYear),
        ...yearsFromEvaluations.map((item) => item.academicYear),
      ])
    );

    const { searchParams } = new URL(request.url);
    const requestedYear = searchParams.get("year")?.trim();
    const academicYear =
      requestedYear && years.includes(requestedYear)
        ? requestedYear
        : years[0] ?? fallbackAcademicYear();

    const chairpersonEvaluations = await prisma.evaluation.findMany({
      where: {
        evaluatedId: chairpersonId,
        academicYear,
      },
      include: {
        answers: {
          select: {
            rating: true,
          },
        },
      },
    });

    const chairpersonRatings = chairpersonEvaluations.flatMap((evaluation) =>
      evaluation.answers.map((answer) => answer.rating)
    );

    const myOverallRating =
      chairpersonRatings.length > 0
        ? Number(
            (
              chairpersonRatings.reduce((sum, rating) => sum + rating, 0) /
              chairpersonRatings.length
            ).toFixed(2)
          )
        : 0;

    const facultyResults = await prisma.result.findMany({
      where: {
        academicYear,
        user: {
          role: "faculty",
          deletedAt: null,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            department: true,
          },
        },
      },
      orderBy: [{ averageRating: "desc" }, { userId: "asc" }],
    });

    const totalFaculty = await prisma.user.count({
      where: {
        role: "faculty",
        deletedAt: null,
      },
    });

    const facultyAverageRating =
      facultyResults.length > 0
        ? Number(
            (
              facultyResults.reduce((sum, result) => sum + result.averageRating, 0) /
              facultyResults.length
            ).toFixed(2)
          )
        : 0;

    const completionRate =
      totalFaculty > 0 ? Math.round((facultyResults.length / totalFaculty) * 100) : 0;

    return NextResponse.json({
      academicYear,
      years: years.length > 0 ? years : [academicYear],
      myRatings: {
        evaluatorName: session.user.name || session.user.email || "Chairperson",
        evaluatorRole: "Chairperson",
        overallRating: myOverallRating,
        breakdown: buildBreakdown(chairpersonRatings),
        totalRatings: chairpersonRatings.length,
      },
      facultyRatings: {
        averageRating: facultyAverageRating,
        completionRate,
        completedCount: facultyResults.length,
        totalCount: totalFaculty,
        results: facultyResults,
      },
    });
  } catch (error) {
    console.error("Chairperson results API error:", error);
    return NextResponse.json(
      { message: "Failed to fetch chairperson results" },
      { status: 500 }
    );
  }
}
