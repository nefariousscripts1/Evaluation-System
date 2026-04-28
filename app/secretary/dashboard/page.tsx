import DashboardContent from "./DashboardContent";
import { requirePageRole } from "@/lib/server-auth";
import { getSecretaryDashboardData } from "@/lib/secretary-dashboard";

export default async function SecretaryDashboard() {
  await requirePageRole(["secretary"]);
  const payload = await getSecretaryDashboardData();

  return <DashboardContent {...payload} />;
}
