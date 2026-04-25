import prisma from "@/lib/db";
import { ApiRouteError, apiSuccess, handleApiError } from "@/lib/api";
import { getAllowedEvaluatedRoles } from "@/lib/role-evaluation";
import { requireApiSession } from "@/lib/server-auth";

export async function GET() {
  try {
    const session = await requireApiSession();
    const allowedRoles = getAllowedEvaluatedRoles(session.user.role ?? "");

    if (allowedRoles.length === 0) {
      throw new ApiRouteError("Unauthorized", { status: 401 });
    }

    const targets = await prisma.user.findMany({
      where: {
        role: { in: allowedRoles },
        deletedAt: null,
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

    return apiSuccess(targets, { preserveRoot: false });
  } catch (error) {
    return handleApiError(error, "Failed to load evaluation targets");
  }
}
