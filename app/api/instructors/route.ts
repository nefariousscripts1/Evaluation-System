import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcrypt";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "secretary") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const instructors = await prisma.user.findMany({
    where: { role: { in: ["faculty", "chairperson", "dean", "director", "campus_director"] }, deletedAt: null },
    select: { id: true, name: true, email: true, role: true, department: true },
  });
  return NextResponse.json(instructors);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "secretary") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, email, password, department, role } = await req.json();
  const hashed = await bcrypt.hash(password, 10);
  const instructor = await prisma.user.create({
    data: { name, email, password: hashed, department, role },
  });
  return NextResponse.json(instructor);
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "secretary") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, name, email, department, role } = await req.json();
  const instructor = await prisma.user.update({
    where: { id },
    data: { name, email, department, role },
  });
  return NextResponse.json(instructor);
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "secretary") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = parseInt(searchParams.get("id") || "0");
  await prisma.user.update({ where: { id }, data: { deletedAt: new Date() } });
  return NextResponse.json({ success: true });
}