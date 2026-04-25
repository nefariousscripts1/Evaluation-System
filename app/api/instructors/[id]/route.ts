import { Prisma } from "@prisma/client";
import prisma from "@/lib/db";
import {
  apiError,
  apiSuccess,
  handleApiError,
  parseJsonBody,
  parseRouteParams,
} from "@/lib/api";
import { requireApiSession } from "@/lib/server-auth";
import { idRouteParamSchema, instructorUpdateSchema } from "@/lib/validation";

async function getInstructor(id: number) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      department: true,
      role: true,
      deletedAt: true,
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
    const instructor = await getInstructor(id);

    if (!instructor || instructor.deletedAt || instructor.role !== "faculty") {
      return apiError("Instructor not found", 404);
    }

    return apiSuccess({
      id: instructor.id,
      name: instructor.name,
      email: instructor.email,
      department: instructor.department,
      role: instructor.role,
    });
  } catch (error) {
    return handleApiError(error, "Failed to fetch instructor");
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiSession(["secretary"]);
    const { id } = parseRouteParams(await params, idRouteParamSchema);
    const existingInstructor = await getInstructor(id);

    if (!existingInstructor || existingInstructor.deletedAt || existingInstructor.role !== "faculty") {
      return apiError("Instructor not found", 404);
    }

    const payload = await parseJsonBody(req, instructorUpdateSchema);
    const instructor = await prisma.user.update({
      where: { id },
      data: {
        name: payload.name,
        email: payload.email,
        department: payload.department,
        role: payload.role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        role: true,
      },
    });

    return apiSuccess({ instructor });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return apiError("An instructor with this email address already exists", 400);
    }

    return handleApiError(error, "Failed to update instructor");
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiSession(["secretary"]);
    const { id } = parseRouteParams(await params, idRouteParamSchema);
    const existingInstructor = await getInstructor(id);

    if (!existingInstructor || existingInstructor.deletedAt || existingInstructor.role !== "faculty") {
      return apiError("Instructor not found", 404);
    }

    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error, "Failed to delete instructor");
  }
}
