import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { ResultsNotReleasedError, assertResultsReleasedForAcademicYear, filterReleasedAcademicYears, isResultsNotReleasedError } from "@/lib/results-release";

export const dynamic = "force-dynamic";

function fallbackAcademicYear() {
  const year = new Date().getFullYear();
  return `${year}-${year + 1}`;
}

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

    const years = await filterReleasedAcademicYears(yearsData.map((item) => item.academicYear));

    const { searchParams } = new URL(request.url);
    const requestedYear = searchParams.get("year");
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

    return NextResponse.json({
      academicYear,
      years,
      comments,
    });
  } catch (error) {
    console.error("Instructor comments API error:", error);
    if (isResultsNotReleasedError(error)) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { message: "Failed to fetch instructor comments" },
      { status: 500 }
    );
  }
}
