import RoleResultsDashboard from "@/components/leadership/RoleResultsDashboard";

export default function DirectorResultsPage() {
  return (
    <RoleResultsDashboard
      apiEndpoint="/api/director/results"
      targetLabel="Dean"
      targetSectionLabel="Dean Ratings"
      targetPopulationLabel="Deans"
      targetSummaryDescription="Summary of dean evaluations for the selected academic year."
      emptyResultsMessage="No dean evaluation results found."
      initialMyRoleLabel="DOI"
    />
  );
}
