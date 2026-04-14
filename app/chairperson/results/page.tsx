import RoleResultsDashboard from "@/components/leadership/RoleResultsDashboard";

export default function ChairpersonResultsPage() {
  return (
    <RoleResultsDashboard
      apiEndpoint="/api/chairperson/results"
      targetLabel="Faculty"
      targetSectionLabel="Faculty Ratings"
      targetPopulationLabel="Faculty"
      targetSummaryDescription="Summary of faculty evaluations for the selected academic year."
      emptyResultsMessage="No faculty evaluation results found."
      initialMyRoleLabel="Chairperson"
    />
  );
}
