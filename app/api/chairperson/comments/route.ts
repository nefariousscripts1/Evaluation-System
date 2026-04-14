import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

const semesterOptions = ["all"] as const;

type FacultyComment = {
  id: number;
  comment: string;
};

function fallbackAcademicYear() {
  const year = new Date().getFullYear();
  return `${year}-${year + 1}`;
}

function normalizeCommentKey(comment: string) {
  return comment.trim().replace(/\s+/g, " ").toLowerCase();
}

async function buildCommentItemsForUser(userId: number, academicYear: string) {
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

  return evaluations.flatMap((evaluation) => {
    const items: Array<{
      id: number;
      comment: string;
      academicYear: string;
      evaluatorName: string;
      evaluatorRole: string;
    }> = [];

    const evaluatorName = evaluation.evaluator.name || evaluation.evaluator.email || "Evaluator";
    const evaluatorRole =
      evaluation.evaluator.role === "campus_director"
        ? "Campus Director"
        : evaluation.evaluator.role === "chairperson"
        ? "Chairperson"
        : evaluation.evaluator.role.charAt(0).toUpperCase() + evaluation.evaluator.role.slice(1);

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
}

async function buildFacultyComments(params: {
  facultyId: number;
  academicYear: string;
  page: number;
  pageSize: number;
}) {
  const { facultyId, academicYear, page, pageSize } = params;

  const faculty = await prisma.user.findUnique({
    where: { id: facultyId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  if (!faculty) {
    return {
      selectedFaculty: null,
      comments: [] as FacultyComment[],
      total: 0,
    };
  }

  const rawItems = await buildCommentItemsForUser(facultyId, academicYear);
  const seenComments = new Set<string>();
  const deduplicated = rawItems.filter((item) => {
    const normalized = normalizeCommentKey(item.comment);

    if (!normalized || seenComments.has(normalized)) {
      return false;
    }

    seenComments.add(normalized);
    return true;
  });

  const startIndex = (page - 1) * pageSize;

  return {
    selectedFaculty: {
      id: faculty.id,
      name: faculty.name || faculty.email,
      label: "Faculty",
    },
    comments: deduplicated.slice(startIndex, startIndex + pageSize).map((item) => ({
      id: item.id,
      comment: item.comment,
    })),
    total: deduplicated.length,
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

    const { searchParams } = new URL(request.url);
    const page = Math.max(Number.parseInt(searchParams.get("page") ?? "1", 10), 1);
    const pageSize = Math.max(Number.parseInt(searchParams.get("pageSize") ?? "5", 10), 1);
    const search = searchParams.get("search")?.trim() ?? "";
    const selectedFacultyId = Number.parseInt(searchParams.get("facultyId") ?? "", 10);
    const requestedSemester = (searchParams.get("semester")?.trim().toLowerCase() ?? "all");

    if (!semesterOptions.includes(requestedSemester as (typeof semesterOptions)[number])) {
      return NextResponse.json({ message: "Invalid semester filter" }, { status: 400 });
    }

    const yearsFromEvaluations = await prisma.evaluation.findMany({
      distinct: ["academicYear"],
      select: { academicYear: true },
      orderBy: { academicYear: "desc" },
    });

    const yearsFromSchedules = await prisma.schedule.findMany({
      distinct: ["academicYear"],
      select: { academicYear: true },
      orderBy: { academicYear: "desc" },
    });

    const years = Array.from(
      new Set([
        ...yearsFromEvaluations.map((item) => item.academicYear),
        ...yearsFromSchedules.map((item) => item.academicYear),
      ])
    );

    const requestedYear = searchParams.get("academicYear")?.trim() ?? "";
    const academicYear =
      requestedYear && years.includes(requestedYear)
        ? requestedYear
        : years[0] ?? fallbackAcademicYear();

    const mySummaryComments = await buildCommentItemsForUser(chairpersonId, academicYear);

    const selectedFaculty =
      Number.isInteger(selectedFacultyId) && selectedFacultyId > 0
        ? await prisma.user.findFirst({
            where: {
              id: selectedFacultyId,
              role: "faculty",
              deletedAt: null,
            },
            select: {
              id: true,
            },
          })
        : search.length > 0
        ? await prisma.user.findFirst({
            where: {
              role: "faculty",
              deletedAt: null,
              OR: [{ name: { contains: search } }, { email: { contains: search } }],
            },
            orderBy: [{ name: "asc" }, { email: "asc" }],
            select: {
              id: true,
            },
          })
        : await prisma.user.findFirst({
            where: {
              role: "faculty",
              deletedAt: null,
              evaluationsReceived: {
                some: {
                  academicYear,
                  OR: [
                    { generalComment: { not: null } },
                    { answers: { some: { comment: { not: null } } } },
                  ],
                },
              },
            },
            orderBy: [{ name: "asc" }, { email: "asc" }],
            select: {
              id: true,
            },
          });

    const facultyComments = selectedFaculty
      ? await buildFacultyComments({
          facultyId: selectedFaculty.id,
          academicYear,
          page,
          pageSize,
        })
      : {
          selectedFaculty: null,
          comments: [] as FacultyComment[],
          total: 0,
        };

    return NextResponse.json({
      academicYear,
      years: years.length > 0 ? years : [academicYear],
      semesters: ["All Semesters"],
      semester: "all",
      mySummaryComments,
      facultyComments,
    });
  } catch (error) {
    console.error("Chairperson comments API error:", error);
    return NextResponse.json(
      { message: "Failed to fetch chairperson comments" },
      { status: 500 }
    );
  }
}
