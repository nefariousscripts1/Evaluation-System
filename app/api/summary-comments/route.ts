import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SEMESTER_OPTIONS } from "@/lib/evaluation-session";

export const dynamic = "force-dynamic";

const instructorRoles = [
  "faculty",
  "chairperson",
  "dean",
  "director",
  "campus_director",
] as const;

function formatRoleLabel(role: string) {
  switch (role) {
    case "campus_director":
      return "Campus Director";
    case "chairperson":
      return "Chairperson";
    default:
      return role.charAt(0).toUpperCase() + role.slice(1);
  }
}

function normalizeCommentKey(comment: string) {
  return comment.trim().replace(/\s+/g, " ").toLowerCase();
}

async function buildInstructorComments(params: {
  instructorId: number;
  academicYear: string;
  semester: string;
  page: number;
  pageSize: number;
}) {
  const { instructorId, academicYear, semester, page, pageSize } = params;

  const instructor = await prisma.user.findUnique({
    where: { id: instructorId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  if (!instructor) {
    return {
      selectedInstructor: null,
      comments: [],
      total: 0,
    };
  }

  const evaluations = await prisma.evaluation.findMany({
    where: {
      evaluatedId: instructorId,
      ...(academicYear ? { academicYear } : {}),
      ...(semester ? { semester } : {}),
    },
    include: {
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

  const rawComments = evaluations.flatMap((evaluation) => {
    const comments: Array<{ id: number; comment: string }> = [];

    if (evaluation.generalComment?.trim()) {
      comments.push({
        id: evaluation.id * 1000,
        comment: evaluation.generalComment.trim(),
      });
    }

    for (const answer of evaluation.answers) {
      if (answer.comment?.trim()) {
        comments.push({
          id: answer.id,
          comment: answer.comment.trim(),
        });
      }
    }

    return comments;
  });

  const seenComments = new Set<string>();
  const allComments = rawComments.filter((comment) => {
    const normalizedKey = normalizeCommentKey(comment.comment);

    if (!normalizedKey || seenComments.has(normalizedKey)) {
      return false;
    }

    seenComments.add(normalizedKey);
    return true;
  });

  const startIndex = (page - 1) * pageSize;

  return {
    selectedInstructor: {
      id: instructor.id,
      name: instructor.name || instructor.email,
      label: formatRoleLabel(instructor.role),
    },
    comments: allComments.slice(startIndex, startIndex + pageSize),
    total: allComments.length,
  };
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== "secretary" && session.user.role !== "admin")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() ?? "";
    const academicYear = searchParams.get("academicYear")?.trim() ?? "";
    const semester = searchParams.get("semester")?.trim() ?? "";
    const page = Math.max(Number.parseInt(searchParams.get("page") ?? "1", 10), 1);
    const pageSize = Math.max(Number.parseInt(searchParams.get("pageSize") ?? "5", 10), 1);

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

    const selectedInstructor = search
      ? await prisma.user.findFirst({
          where: {
            deletedAt: null,
            role: { in: [...instructorRoles] },
            OR: [
              { name: { contains: search } },
              { email: { contains: search } },
            ],
          },
          orderBy: [{ name: "asc" }, { email: "asc" }],
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        })
      : await prisma.user.findFirst({
          where: {
            deletedAt: null,
            role: { in: [...instructorRoles] },
            evaluationsReceived: {
              some: {
                ...(academicYear ? { academicYear } : {}),
                ...(semester ? { semester } : {}),
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
            name: true,
            email: true,
            role: true,
          },
        });

    if (!selectedInstructor) {
      return NextResponse.json({
        years,
        semesters: SEMESTER_OPTIONS.filter((item) => item !== "Summer"),
        selectedInstructor: null,
        comments: [],
        total: 0,
      });
    }

    const instructorComments = await buildInstructorComments({
      instructorId: selectedInstructor.id,
      academicYear,
      semester,
      page,
      pageSize,
    });

    return NextResponse.json({
      years,
      semesters: SEMESTER_OPTIONS.filter((item) => item !== "Summer"),
      ...instructorComments,
    });
  } catch (error) {
    console.error("Summary comments API error:", error);
    return NextResponse.json(
      {
        message: "Failed to fetch summary comments",
        years: [],
        semesters: [],
        selectedInstructor: null,
        comments: [],
        total: 0,
      },
      { status: 500 }
    );
  }
}
