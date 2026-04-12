import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }  // ← Make params a Promise
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "secretary") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;  // ← Await params
  
  // Your existing PUT logic here
  const data = await req.json();
  const questionnaire = await prisma.questionnaire.update({
    where: { id: parseInt(id) },
    data: data,
  });

  return NextResponse.json(questionnaire);
}

// Also fix GET, DELETE, or any other methods in this file
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }  // ← Make params a Promise
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "secretary") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;  // ← Await params
  
  const questionnaire = await prisma.questionnaire.findUnique({
    where: { id: parseInt(id) },
  });

  return NextResponse.json(questionnaire);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }  // ← Make params a Promise
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "secretary") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;  // ← Await params
  
  await prisma.questionnaire.delete({
    where: { id: parseInt(id) },
  });

  return NextResponse.json({ message: "Questionnaire deleted successfully" });
}