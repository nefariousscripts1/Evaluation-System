"use server";

import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcrypt";
import { revalidatePath } from "next/cache";

// Utility
async function isWithinSchedule(academicYear: string): Promise<boolean> {
  const schedule = await prisma.schedule.findFirst({
    where: { academicYear },
  });
  if (!schedule) return false;
  const now = new Date();
  return now >= schedule.startDate && now <= schedule.endDate;
}

export async function getCurrentAcademicYear() {
  const now = new Date();
  const year = now.getFullYear();
  return `${year}-${year + 1}`;
}

export async function submitEvaluation(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  const evaluatorId = parseInt(session.user.id);
  const evaluatedId = parseInt(formData.get("evaluatedId") as string);
  const academicYear = formData.get("academicYear") as string;
  const answersData = JSON.parse(formData.get("answers") as string);

  // Check schedule
  const within = await isWithinSchedule(academicYear);
  if (!within) throw new Error("Evaluation period is closed");

  // Check duplicate
  const existing = await prisma.evaluation.findUnique({
    where: {
      evaluatorId_evaluatedId_academicYear: {
        evaluatorId,
        evaluatedId,
        academicYear,
      },
    },
  });
  if (existing) throw new Error("You have already evaluated this person for this academic year");

  // Create evaluation
  await prisma.evaluation.create({
    data: {
      evaluatorId,
      evaluatedId,
      academicYear,
      answers: {
        create: answersData.map((a: any) => ({
          questionId: a.questionId,
          rating: a.rating,
          comment: a.comment,
        })),
      },
    },
  });

  // Recalculate average rating for evaluated user
  const allRatings = await prisma.evaluationAnswer.aggregate({
    where: {
      evaluation: {
        evaluatedId,
        academicYear,
      },
    },
    _avg: { rating: true },
  });
  const avg = allRatings._avg.rating || 0;

  await prisma.result.upsert({
    where: {
      userId_academicYear: {
        userId: evaluatedId,
        academicYear,
      },
    },
    update: { averageRating: avg },
    create: {
      userId: evaluatedId,
      academicYear,
      averageRating: avg,
    },
  });

  revalidatePath("/evaluate");
  revalidatePath("/results");
  revalidatePath("/admin/reports");
}

export async function createUser(data: {
  email: string;
  password: string;
  name: string;
  role: string;
}) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "admin") throw new Error("Unauthorized");

  const hashed = await bcrypt.hash(data.password, 10);
  await prisma.user.create({
    data: {
      email: data.email,
      password: hashed,
      name: data.name,
      role: data.role as any,
    },
  });
  revalidatePath("/admin/users");
}

export async function updateUser(id: number, data: Partial<{ email: string; name: string; role: string }>) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "admin") throw new Error("Unauthorized");

  await prisma.user.update({
    where: { id },
    data: {
      email: data.email,
      name: data.name,
      role: data.role as any,
    },
  });
  revalidatePath("/admin/users");
}

export async function deleteUser(id: number) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "admin") throw new Error("Unauthorized");

  await prisma.user.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  revalidatePath("/admin/users");
}

export async function createQuestion(data: { questionText: string; category: string }) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "admin") throw new Error("Unauthorized");

  await prisma.questionnaire.create({ data });
  revalidatePath("/admin/questionnaire");
}

export async function updateQuestion(id: number, data: { questionText: string; category: string }) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "admin") throw new Error("Unauthorized");

  await prisma.questionnaire.update({ where: { id }, data });
  revalidatePath("/admin/questionnaire");
}

export async function deleteQuestion(id: number) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "admin") throw new Error("Unauthorized");

  await prisma.questionnaire.delete({ where: { id } });
  revalidatePath("/admin/questionnaire");
}

export async function setSchedule(data: { academicYear: string; startDate: Date; endDate: Date }) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "admin") throw new Error("Unauthorized");

  await prisma.schedule.upsert({
    where: { academicYear: data.academicYear },
    update: data,
    create: data,
  });
  revalidatePath("/admin/schedule");
}

export async function getEvaluableUsers() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  const role = session.user.role;
  let targetRoles: string[] = [];

  switch (role) {
    case "student":
      targetRoles = ["faculty"];
      break;
    case "chairperson":
      targetRoles = ["faculty"];
      break;
    case "dean":
      targetRoles = ["chairperson"];
      break;
    case "director":
      targetRoles = ["dean"];
      break;
    case "campus_director":
      targetRoles = ["director"];
      break;
    default:
      return [];
  }

  const users = await prisma.user.findMany({
    where: {
      role: { in: targetRoles as any },
      deletedAt: null,
    },
    select: { id: true, name: true, email: true, role: true },
  });
  return users;
}