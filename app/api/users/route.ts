import { Prisma } from "@prisma/client";
import prisma from "@/lib/db";
import { apiError, apiSuccess, handleApiError, parseJsonBody } from "@/lib/api";
import { hashPassword } from "@/lib/password-auth";
import { requireApiSession } from "@/lib/server-auth";
import { staffUserCreateSchema } from "@/lib/validation";

function getUniqueConstraintMessage(error: Prisma.PrismaClientKnownRequestError) {
  const targetMeta = error.meta?.target;
  const target = Array.isArray(targetMeta)
    ? targetMeta
    : typeof targetMeta === "string"
    ? [targetMeta]
    : [];

  if (target.includes("email") || target.includes("User_email_key")) {
    return "An account with this email address already exists";
  }

  if (target.includes("studentId") || target.includes("User_studentId_key")) {
    return "This student ID is already in use";
  }

  return "A record with this information already exists";
}

export async function GET() {
  try {
    await requireApiSession(["secretary"]);

    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
        role: {
          not: "student",
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
      },
      orderBy: [{ role: "asc" }, { name: "asc" }],
    });

    return apiSuccess(users, { preserveRoot: false });
  } catch (error) {
    return handleApiError(error, "Failed to fetch users");
  }
}

export async function POST(request: Request) {
  try {
    await requireApiSession(["secretary"]);
    const payload = await parseJsonBody(request, staffUserCreateSchema);
    const hashedPassword = await hashPassword(payload.password);

    const user = await prisma.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        password: hashedPassword,
        mustChangePassword: true,
        role: payload.role,
        department: payload.department,
        studentId: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
      },
    });

    return apiSuccess({ user }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return apiError(getUniqueConstraintMessage(error), 400);
    }

    return handleApiError(error, "Failed to create user");
  }
}
