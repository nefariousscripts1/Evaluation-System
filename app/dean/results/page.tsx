import RoleResultsDashboard from "@/components/leadership/RoleResultsDashboard";

export default function DeanResultsPage() {
  return (
    <RoleResultsDashboard
      apiEndpoint="/api/dean/results"
      targetLabel="Chairperson"
      targetSectionLabel="Chairperson Ratings"
      targetPopulationLabel="Chairpersons"
      targetSummaryDescription="Summary of chairperson evaluations for the selected academic year."
      emptyResultsMessage="No chairperson evaluation results found."
      initialMyRoleLabel="Dean"
    />
  );
}
