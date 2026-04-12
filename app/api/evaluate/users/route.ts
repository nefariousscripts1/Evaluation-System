import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const instructors = await prisma.user.findMany({
    where: { 
      role: { in: ["faculty", "chairperson", "dean", "director", "campus_director"] },
      deletedAt: null 
    },
    select: { id: true, name: true, email: true, role: true, department: true },
  });
  return NextResponse.json(instructors);
}
