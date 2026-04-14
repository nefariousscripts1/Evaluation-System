"use server";

import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcrypt";
import { revalidatePath } from "next/cache";
import { submitEvaluationRecord } from "@/lib/evaluation-submission";
import { getAllowedEvaluatedRoles } from "@/lib/role-evaluation";

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

  const evaluatorId = Number.parseInt(session.user.id ?? "", 10);
  const evaluatedId = formData.get("evaluatedId");
  const academicYear = formData.get("academicYear");
  const answersData = JSON.parse(formData.get("answers") as string);
  const comment = formData.get("comment");

  await submitEvaluationRecord({
    evaluatorId,
    evaluatorRole: session.user.role ?? "",
    evaluatedId,
    academicYear,
    answers: answersData,
    comment,
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

  const targetRoles = getAllowedEvaluatedRoles(session.user.role ?? "");

  if (targetRoles.length === 0) {
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
