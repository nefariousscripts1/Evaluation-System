import { Prisma } from "@prisma/client";
import prisma from "@/lib/db";
import {
  apiError,
  apiSuccess,
  handleApiError,
  parseJsonBody,
  parseRouteParams,
} from "@/lib/api";
import { requireApiSession } from "@/lib/server-auth";
import { idRouteParamSchema, studentRecordSchema } from "@/lib/validation";

function buildStudentPlaceholderEmail(studentId: string) {
  const normalized = studentId.replace(/[^A-Z0-9-]/g, "").toLowerCase();
  return `student.${normalized}@access.local`;
}

async function getExistingStudent(id: number) {
  return prisma.user.findFirst({
    where: {
      id,
      role: "student",
    },
    select: {
      id: true,
      studentId: true,
      createdAt: true,
      deletedAt: true,
    },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiSession(["secretary"]);
    const { id } = parseRouteParams(await params, idRouteParamSchema);
    const student = await getExistingStudent(id);

    if (!student || student.deletedAt) {
      return apiError("Student not found", 404);
    }

    return apiSuccess({
      id: student.id,
      studentId: student.studentId,
      createdAt: student.createdAt,
    });
  } catch (error) {
    return handleApiError(error, "Failed to fetch student");
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiSession(["secretary"]);
    const { id } = parseRouteParams(await params, idRouteParamSchema);
    const existingStudent = await getExistingStudent(id);

    if (!existingStudent || existingStudent.deletedAt) {
      return apiError("Student not found", 404);
    }

    const { studentId } = await parseJsonBody(request, studentRecordSchema);
    const student = await prisma.user.update({
      where: { id },
      data: {
        studentId,
        email: buildStudentPlaceholderEmail(studentId),
      },
      select: {
        id: true,
        studentId: true,
        createdAt: true,
      },
    });

    return apiSuccess({ student });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return apiError("Student ID already exists", 400);
    }

    return handleApiError(error, "Failed to update student record");
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiSession(["secretary"]);
    const { id } = parseRouteParams(await params, idRouteParamSchema);
    const existingStudent = await getExistingStudent(id);

    if (!existingStudent || existingStudent.deletedAt) {
      return apiError("Student not found", 404);
    }

    await prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error, "Failed to delete student record");
  }
}
