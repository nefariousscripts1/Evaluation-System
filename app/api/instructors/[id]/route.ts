import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "secretary") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const instructorId = Number(id);
  if (!Number.isInteger(instructorId) || instructorId <= 0) {
    return NextResponse.json({ error: "Invalid instructor id" }, { status: 400 });
  }

  try {
    const instructor = await prisma.user.findUnique({
      where: { id: instructorId },
      select: { id: true, name: true, email: true, department: true, role: true },
    });

    return NextResponse.json(instructor);
  } catch (error) {
    console.error("Failed to fetch instructor:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch instructor" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "secretary") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const instructorId = Number(id);
  if (!Number.isInteger(instructorId) || instructorId <= 0) {
    return NextResponse.json({ error: "Invalid instructor id" }, { status: 400 });
  }

  try {
    const { name, email, department, role } = await req.json();
    const instructor = await prisma.user.update({
      where: { id: instructorId },
      data: { name, email, department, role },
    });

    return NextResponse.json(instructor);
  } catch (error) {
    console.error("Failed to update instructor:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Instructor not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update instructor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "secretary") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const instructorId = Number(id);
  if (!Number.isInteger(instructorId) || instructorId <= 0) {
    return NextResponse.json({ error: "Invalid instructor id" }, { status: 400 });
  }

  try {
    await prisma.user.update({
      where: { id: instructorId },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete instructor:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Instructor not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete instructor" },
      { status: 500 }
    );
  }
}
