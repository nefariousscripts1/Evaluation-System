import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcrypt";
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

export async function GET() {
  try {
    const session = await requireSecretary();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    return NextResponse.json(students);
  } catch (error) {
    console.error("Students API GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSecretary();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const studentId = String(body.studentId ?? "").trim();

    if (!studentId) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
    }

    const placeholderPassword = await bcrypt.hash(randomUUID(), 10);
    const user = await prisma.user.create({
      data: {
        name: null,
        email: buildStudentPlaceholderEmail(studentId),
        password: placeholderPassword,
        role: "student",
        studentId,
        department: null,
        agreedToTerms: true,
      },
      select: {
        id: true,
        studentId: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, student: user });
  } catch (error: any) {
    console.error("Students API POST error:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "Student ID already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error?.message || "Failed to create student record" },
      { status: 500 }
    );
  }
}
