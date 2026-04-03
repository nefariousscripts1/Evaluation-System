import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const questions = await prisma.questionnaire.findMany({
    orderBy: { category: "asc" },
  });
  return NextResponse.json(questions);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "secretary") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { questionText, category, isActive } = await req.json();
  const question = await prisma.questionnaire.create({
    data: { questionText, category, isActive: isActive ?? true },
  });
  return NextResponse.json(question);
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "secretary") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, questionText, category, isActive } = await req.json();
  const question = await prisma.questionnaire.update({
    where: { id },
    data: { questionText, category, isActive },
  });
  return NextResponse.json(question);
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "secretary") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = parseInt(searchParams.get("id") || "0");
  await prisma.questionnaire.delete({ where: { id } });
  return NextResponse.json({ success: true });
}