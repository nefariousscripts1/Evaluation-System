import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/db";
import { authOptions } from "@/lib/auth";

function buildStudentPlaceholderEmail(studentId: string) {
  const normalized = studentId.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  return `student.${normalized}@access.local`;
}

async function requireSecretary() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "secretary") {
    return null;
  }

  return session;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSecretary();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: idParam } = await params;
    const id = Number.parseInt(idParam, 10);

    const student = await prisma.user.findFirst({
      where: {
        id,
        role: "student",
      },
      select: {
        id: true,
        studentId: true,
        createdAt: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json(student);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch student" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSecretary();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: idParam } = await params;
    const id = Number.parseInt(idParam, 10);
    const body = await request.json();
    const studentId = String(body.studentId ?? "").trim();

    if (!studentId) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
    }

    const existingStudent = await prisma.user.findFirst({
      where: {
        id,
        role: "student",
      },
      select: { id: true },
    });

    if (!existingStudent) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const updatedStudent = await prisma.user.update({
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

    return NextResponse.json({ success: true, student: updatedStudent });
  } catch (error: any) {
    console.error("Students API PUT error:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "Student ID already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error?.message || "Failed to update student record" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSecretary();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: idParam } = await params;
    const id = Number.parseInt(idParam, 10);

    const existingStudent = await prisma.user.findFirst({
      where: {
        id,
        role: "student",
      },
      select: { id: true },
    });

    if (!existingStudent) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    await prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Students API DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete student record" }, { status: 500 });
  }
}
