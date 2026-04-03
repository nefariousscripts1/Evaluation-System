import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "secretary") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const instructor = await prisma.user.findUnique({
    where: { id: parseInt(params.id) },
    select: { id: true, name: true, email: true, department: true, role: true },
  });

  return NextResponse.json(instructor);
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "secretary") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, email, department, role } = await req.json();
  const instructor = await prisma.user.update({
    where: { id: parseInt(params.id) },
    data: { name, email, department, role },
  });

  return NextResponse.json(instructor);
}