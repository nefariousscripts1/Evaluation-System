import { Prisma } from "@prisma/client";
import prisma from "@/lib/db";
import {
  apiError,
  apiSuccess,
  handleApiError,
  parseJsonBody,
  parseRouteParams,
} from "@/lib/api";
import { hashPassword } from "@/lib/password-auth";
import { requireApiSession } from "@/lib/server-auth";
import { idRouteParamSchema, staffUserUpdateSchema } from "@/lib/validation";

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

async function getExistingStaffUser(id: number) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      role: true,
      deletedAt: true,
      name: true,
      email: true,
      department: true,
    },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiSession(["secretary"]);
    const { id } = parseRouteParams(await params, idRouteParamSchema);
    const user = await getExistingStaffUser(id);

    if (!user || user.deletedAt) {
      return apiError("User not found", 404);
    }

    if (user.role === "student") {
      return apiError("Use Student Management for student records", 400);
    }

    return apiSuccess({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
    });
  } catch (error) {
    return handleApiError(error, "Failed to fetch user");
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiSession(["secretary"]);
    const { id } = parseRouteParams(await params, idRouteParamSchema);
    const existingUser = await getExistingStaffUser(id);

    if (!existingUser || existingUser.deletedAt) {
      return apiError("User not found", 404);
    }

    if (existingUser.role === "student") {
      return apiError("Use Student Management for student records", 400);
    }

    const payload = await parseJsonBody(request, staffUserUpdateSchema);

    const updateData: {
      name: string;
      email: string;
      role: typeof payload.role;
      department: string | null;
      mustChangePassword?: boolean;
      password?: string;
    } = {
      name: payload.name,
      email: payload.email,
      role: payload.role,
      department: payload.department,
    };

    if (payload.password) {
      updateData.password = await hashPassword(payload.password);
      updateData.mustChangePassword = true;
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
      },
    });

    return apiSuccess({ user });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return apiError(getUniqueConstraintMessage(error), 400);
    }

    return handleApiError(error, "Failed to update user");
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiSession(["secretary"]);
    const { id } = parseRouteParams(await params, idRouteParamSchema);
    const existingUser = await getExistingStaffUser(id);

    if (!existingUser || existingUser.deletedAt) {
      return apiError("User not found", 404);
    }

    if (existingUser.role === "student") {
      return apiError("Use Student Management for student records", 400);
    }

    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error, "Failed to delete user");
  }
}
