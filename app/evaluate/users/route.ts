import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
      return NextResponse.json([]);
  }

  const users = await prisma.user.findMany({
    where: { role: { in: targetRoles as any }, deletedAt: null },
    select: { id: true, name: true, email: true, role: true },
  });
  return NextResponse.json(users);
}