import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SEMESTER_OPTIONS } from "@/lib/evaluation-session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== "secretary" && session.user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const academicYear = searchParams.get("academicYear");
    const semester = searchParams.get("semester");

    const where: Record<string, string> = {};
    if (academicYear) {
      where.academicYear = academicYear;
    }
    if (semester) {
      where.semester = semester;
    }

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
            semester: true,
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

    const years = yearsData.map((y) => y.academicYear);

    return NextResponse.json({
      results,
      years,
      semesters: SEMESTER_OPTIONS.filter((item) => item !== "Summer"),
    });
  } catch (error) {
    console.error("Reports API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports", results: [], years: [], semesters: [] },
      { status: 500 }
    );
  }
}
