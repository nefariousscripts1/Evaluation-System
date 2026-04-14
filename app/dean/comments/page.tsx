import RoleCommentsView from "@/components/leadership/RoleCommentsView";

export default function DeanCommentsPage() {
  return (
    <RoleCommentsView
      apiEndpoint="/api/dean/comments"
      viewerRoleLabel="Dean"
      targetLabel="Chairperson"
      targetPluralLabel="Chairperson"
    />
  );
}
