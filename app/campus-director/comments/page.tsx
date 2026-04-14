import SingleTargetCommentsView from "@/components/leadership/SingleTargetCommentsView";

export default function CampusDirectorCommentsPage() {
  return (
    <SingleTargetCommentsView
      apiEndpoint="/api/campus-director/comments"
      title="View Director of Instruction Summary Comments"
      targetLabel="DOI"
      searchPlaceholder="Search DOI"
    />
  );
}
