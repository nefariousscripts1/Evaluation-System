import RoleCommentsView from "@/components/leadership/RoleCommentsView";

export default function DirectorCommentsPage() {
  return (
    <RoleCommentsView
      apiEndpoint="/api/director/comments"
      viewerRoleLabel="DOI"
      targetLabel="Dean"
      targetPluralLabel="Dean"
    />
  );
}
