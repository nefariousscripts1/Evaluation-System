import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcrypt";
import { getActiveSchedule } from "@/lib/evaluation-session";
import { ensureInstructorAccessCodesForSchedule } from "@/lib/instructor-access";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "secretary") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activeSchedule = await getActiveSchedule();
  if (activeSchedule) {
    await ensureInstructorAccessCodesForSchedule(activeSchedule.id);
  }

  const instructors = await prisma.user.findMany({
    where: { role: "faculty", deletedAt: null },
    select: { id: true, name: true, email: true, role: true, department: true },
    orderBy: { name: "asc" },
  });

  const activeCodes = activeSchedule
    ? await prisma.instructorAccessCode.findMany({
        where: { scheduleId: activeSchedule.id, instructorId: { in: instructors.map((item) => item.id) } },
        select: { instructorId: true, code: true },
      })
    : [];

  const activeCodeMap = new Map(activeCodes.map((item) => [item.instructorId, item.code]));

  return NextResponse.json({
    activeSchedule: activeSchedule
      ? {
          id: activeSchedule.id,
          academicYear: activeSchedule.academicYear,
          semester: activeSchedule.semester,
        }
      : null,
    instructors: instructors.map((instructor) => ({
      id: instructor.id,
      name: instructor.name,
      email: instructor.email,
      role: instructor.role,
      department: instructor.department,
      activeInstructorCode: activeCodeMap.get(instructor.id) ?? null,
    })),
  });
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

  const activeSchedule = await getActiveSchedule();
  if (activeSchedule && instructor.role === "faculty") {
    await ensureInstructorAccessCodesForSchedule(activeSchedule.id, [instructor.id]);
  }

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
