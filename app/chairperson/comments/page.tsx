import RoleCommentsView from "@/components/leadership/RoleCommentsView";

export default function ChairpersonCommentsPage() {
  return (
    <RoleCommentsView
      apiEndpoint="/api/chairperson/comments"
      viewerRoleLabel="Chairperson"
      targetLabel="Faculty"
      targetPluralLabel="Faculty"
    />
  );
}
