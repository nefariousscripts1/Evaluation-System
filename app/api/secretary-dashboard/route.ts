import { apiSuccess, handleApiError } from "@/lib/api";
import { requireApiSession } from "@/lib/server-auth";
import { getSecretaryDashboardData } from "@/lib/secretary-dashboard";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireApiSession(["secretary"]);
    return apiSuccess(await getSecretaryDashboardData(), { preserveRoot: false });
  } catch (error) {
    return handleApiError(error, "Failed to load dashboard data");
  }
}
