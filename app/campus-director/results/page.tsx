import SingleTargetResultsDashboard from "@/components/leadership/SingleTargetResultsDashboard";

export default function CampusDirectorResultsPage() {
  return (
    <SingleTargetResultsDashboard
      apiEndpoint="/api/campus-director/results"
      targetLabel="DOI"
      targetPluralLabel="Director of Instructions"
      subtitle="Summary of campus director evaluations for director of instructions"
      emptyResultsMessage="No DOI evaluation results found."
    />
  );
}
