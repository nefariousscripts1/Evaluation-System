import PortalPageLoader from "@/components/ui/PortalPageLoader";

export default function SecretaryDashboardLoading() {
  return (
    <PortalPageLoader
      title="Secretary Dashboard"
      description="Loading summary cards, faculty activity, and schedule snapshots..."
      cards={4}
    />
  );
}
