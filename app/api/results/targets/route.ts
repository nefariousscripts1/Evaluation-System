import prisma from "@/lib/db";
import { apiSuccess, handleApiError } from "@/lib/api";
import { requireApiSession } from "@/lib/server-auth";
import {
  buildAccessibleResultsUserWhere,
  getResultsAccessContext,
  getSubordinateResultsRole,
  resultsViewerRoles,
} from "@/lib/results-access";
import { getReportableRoleLabel } from "@/lib/reporting-roles";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(resultsViewerRoles);
    const accessContext = getResultsAccessContext(session);

    if (!accessContext) {
      return apiSuccess([], { preserveRoot: false });
    }
    const { searchParams } = new URL(request.url);
    const includeOwn = searchParams.get("includeOwn")?.trim().toLowerCase() === "true";
    const scope = searchParams.get("scope")?.trim().toLowerCase() ?? "subordinate";
    const requestedRole = searchParams.get("role")?.trim().toLowerCase() ?? "";
    const subordinateRole = getSubordinateResultsRole(accessContext.role);
    const restrictToRoles =
      requestedRole && resultsViewerRoles.includes(requestedRole as never)
        ? [requestedRole as (typeof resultsViewerRoles)[number]]
        : scope === "subordinate" && subordinateRole
        ? [subordinateRole]
        : undefined;

    const targets = await prisma.user.findMany({
      where: buildAccessibleResultsUserWhere(accessContext, {
        includeOwn,
        includeSubordinate: scope !== "own",
        restrictToRoles,
      }),
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
      },
      orderBy: [{ role: "asc" }, { name: "asc" }, { email: "asc" }],
    });

    return apiSuccess(
      targets.map((target) => ({
        ...target,
        roleLabel: getReportableRoleLabel(target.role),
      })),
      { preserveRoot: false }
    );
  } catch (error) {
    return handleApiError(error, "Failed to load result targets");
  }
}
