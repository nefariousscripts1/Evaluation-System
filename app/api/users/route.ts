import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcrypt";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/db";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (session.user.role !== "secretary") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
        role: {
          not: "student",
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
      },
      orderBy: [{ role: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

function getUniqueConstraintMessage(error: Prisma.PrismaClientKnownRequestError) {
  const targetMeta = error.meta?.target;
  const target = Array.isArray(targetMeta)
    ? targetMeta
    : typeof targetMeta === "string"
      ? [targetMeta]
      : [];

  if (target.includes("email") || target.includes("User_email_key")) {
    return "An account with this email address already exists";
  }

  if (target.includes("studentId") || target.includes("User_studentId_key")) {
    return "This student ID is already in use";
  }

  return "A record with this information already exists";
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "secretary") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const role = String(body.role ?? "").trim();
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const department = body.department ? String(body.department).trim() : null;

    if (!role || role === "student") {
      return NextResponse.json(
        { error: "Users Management is for staff accounts only" },
        { status: 400 }
      );
    }

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role as never,
        department,
        studentId: null,
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error("POST Error:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: getUniqueConstraintMessage(error) },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
