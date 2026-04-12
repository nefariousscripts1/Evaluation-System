import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

type SummaryRole = "student" | "chairperson";

function fallbackAcademicYear() {
  const year = new Date().getFullYear();
  return `${year}-${year + 1}`;
}

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
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "faculty") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = Number.parseInt(session.user.id ?? "", 10);
    if (!Number.isInteger(userId)) {
      return NextResponse.json({ message: "Invalid session user" }, { status: 401 });
    }

    const yearsData = await prisma.evaluation.findMany({
      where: { evaluatedId: userId },
      distinct: ["academicYear"],
      select: { academicYear: true },
      orderBy: { academicYear: "desc" },
    });

    const years =
      yearsData.length > 0
        ? yearsData.map((item) => item.academicYear)
        : [fallbackAcademicYear()];

    const { searchParams } = new URL(request.url);
    const requestedYear = searchParams.get("year");
    const academicYear =
      requestedYear && years.includes(requestedYear) ? requestedYear : years[0];

    const [studentEvaluations, chairpersonEvaluation] = await Promise.all([
      getSummaryForRole(userId, academicYear, "student"),
      getSummaryForRole(userId, academicYear, "chairperson"),
    ]);

    return NextResponse.json({
      academicYear,
      years,
      studentEvaluations,
      chairpersonEvaluation,
    });
  } catch (error) {
    console.error("Instructor ratings API error:", error);
    return NextResponse.json(
      { message: "Failed to fetch instructor ratings" },
      { status: 500 }
    );
  }
}
