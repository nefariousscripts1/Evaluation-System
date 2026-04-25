import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/db";
import { apiError, apiSuccess, handleApiError, parseJsonBody } from "@/lib/api";
import { requireApiSession } from "@/lib/server-auth";
import { studentRecordSchema } from "@/lib/validation";

function buildStudentPlaceholderEmail(studentId: string) {
  const normalized = studentId.replace(/[^A-Z0-9-]/g, "").toLowerCase();
  return `student.${normalized}@access.local`;
}

export async function GET() {
  try {
    await requireApiSession(["secretary"]);

    const students = await prisma.user.findMany({
      where: {
        role: "student",
        deletedAt: null,
      },
      select: {
        id: true,
        studentId: true,
        createdAt: true,
      },
      orderBy: [{ studentId: "asc" }],
    });

    return apiSuccess(students, { preserveRoot: false });
  } catch (error) {
    return handleApiError(error, "Failed to fetch student records");
  }
}

export async function POST(request: Request) {
  try {
    await requireApiSession(["secretary"]);
    const { studentId } = await parseJsonBody(request, studentRecordSchema);
    const placeholderPassword = await bcrypt.hash(randomUUID(), 10);

    const student = await prisma.user.create({
      data: {
        name: null,
        email: buildStudentPlaceholderEmail(studentId),
        password: placeholderPassword,
        role: "student",
        studentId,
        department: null,
      },
      select: {
        id: true,
        studentId: true,
        createdAt: true,
      },
    });

    return apiSuccess({ student }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return apiError("Student ID already exists", 400);
    }

    return handleApiError(error, "Failed to create student record");
  }
}
