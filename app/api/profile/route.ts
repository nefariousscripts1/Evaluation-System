import prisma from "@/lib/db";
import { apiSuccess, handleApiError, parseJsonBody } from "@/lib/api";
import { requireApiUserId } from "@/lib/server-auth";
import { ownProfileUpdateSchema } from "@/lib/validation";

export async function GET() {
  try {
    const { userId } = await requireApiUserId();

    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        mustChangePassword: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return apiSuccess(user, { preserveRoot: false });
  } catch (error) {
    return handleApiError(error, "Failed to load profile");
  }
}

export async function PUT(request: Request) {
  try {
    const { userId } = await requireApiUserId();
    const payload = await parseJsonBody(request, ownProfileUpdateSchema);

    const user = await prisma.user.update({
      where: { id: userId },
      data: { name: payload.name },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        mustChangePassword: true,
      },
    });

    return apiSuccess({ message: "Profile updated successfully", user });
  } catch (error) {
    return handleApiError(error, "Failed to update profile");
  }
}
