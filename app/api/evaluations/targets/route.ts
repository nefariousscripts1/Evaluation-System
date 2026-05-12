import prisma from "@/lib/db";
import { ApiRouteError, apiSuccess, handleApiError } from "@/lib/api";
import { getActiveSchedule } from "@/lib/evaluation-session";
import { getAllowedEvaluatedRoles } from "@/lib/role-evaluation";
import { requireApiUserId } from "@/lib/server-auth";

export async function GET() {
  try {
    const { session, userId } = await requireApiUserId();
    const allowedRoles = getAllowedEvaluatedRoles(session.user.role ?? "");

    if (allowedRoles.length === 0) {
      throw new ApiRouteError("Unauthorized", { status: 401 });
    }

    const activeSchedule = await getActiveSchedule();
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

    const submittedTargetIds =
      activeSchedule
        ? new Set(
            (
              await prisma.evaluation.findMany({
                where: {
                  evaluatorRole: session.user.role as never,
                  evaluatorId: userId,
                  scheduleId: activeSchedule.id,
                  evaluatedId: { in: targets.map((target) => target.id) },
                },
                select: { evaluatedId: true },
              })
            ).map((evaluation) => evaluation.evaluatedId)
          )
        : new Set<number>();

    return apiSuccess(
      targets.map((target) => ({
        ...target,
        alreadySubmitted: submittedTargetIds.has(target.id),
      })),
      { preserveRoot: false }
    );
  } catch (error) {
    return handleApiError(error, "Failed to load evaluation targets");
  }
}
