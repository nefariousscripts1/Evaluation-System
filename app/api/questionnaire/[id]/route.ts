import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "secretary") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { questionText, category } = await req.json();
  const id = parseInt(params.id);
  
  const question = await prisma.questionnaire.update({
    where: { id },
    data: {
      questionText,
      category: category || null,
    },
  });
  
  return NextResponse.json(question);
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "secretary") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = parseInt(params.id);
  await prisma.questionnaire.delete({ where: { id } });
  
  return NextResponse.json({ success: true });
}