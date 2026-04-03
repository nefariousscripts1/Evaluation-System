import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { evaluatedId, academicYear, answers } = await req.json();
  const evaluatorId = parseInt(session.user.id);

  // Check schedule
  const schedule = await prisma.schedule.findFirst({
    where: { academicYear, isOpen: true },
  });
  if (!schedule) {
    return NextResponse.json({ message: "Evaluation period is closed" }, { status: 400 });
  }

  const now = new Date();
  if (now < schedule.startDate || now > schedule.endDate) {
    return NextResponse.json({ message: "Evaluation period is closed" }, { status: 400 });
  }

  // Check duplicate
  const existing = await prisma.evaluation.findUnique({
    where: {
      evaluatorId_evaluatedId_academicYear: { evaluatorId, evaluatedId, academicYear },
    },
  });
  if (existing) {
    return NextResponse.json({ message: "You have already evaluated this person" }, { status: 400 });
  }

  // Create evaluation
  await prisma.evaluation.create({
    data: {
      evaluatorId,
      evaluatedId,
      academicYear,
      answers: { create: answers },
    },
  });

  // Update average rating
  const allRatings = await prisma.evaluationAnswer.aggregate({
    where: { evaluation: { evaluatedId, academicYear } },
    _avg: { rating: true },
  });
  const avg = allRatings._avg.rating || 0;

  await prisma.result.upsert({
    where: { userId_academicYear: { userId: evaluatedId, academicYear } },
    update: { averageRating: avg },
    create: { userId: evaluatedId, academicYear, averageRating: avg },
  });

  return NextResponse.json({ success: true });
}