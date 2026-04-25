import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import bcrypt from "bcrypt";
import { Prisma } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const { email, password, name, role, studentId } = await req.json();

    if (!email || !password || !name || !studentId) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    if (role !== "student") {
      return NextResponse.json({ message: "Only student registration is allowed" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ message: "Email already exists" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        email: String(email).trim().toLowerCase(),
        password: hashed,
        name: String(name).trim(),
        role: "student",
        studentId: String(studentId).trim(),
      },
    });

    return NextResponse.json({ message: "User created successfully" }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { message: "Email or student ID already exists" },
          { status: 400 }
        );
      }
    }

    if (
      error instanceof Prisma.PrismaClientInitializationError ||
      error instanceof Prisma.PrismaClientRustPanicError
    ) {
      return NextResponse.json(
        { message: "Database connection failed. Check Vercel DATABASE_URL and Prisma migrations." },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
