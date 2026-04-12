import RoleEvaluationPortal from "@/components/evaluation/RoleEvaluationPortal";
import { getEvaluationPortalCopy } from "@/lib/role-evaluation";

export default function ChairpersonEvaluatePage() {
  return (
    <RoleEvaluationPortal
      allowedRole="chairperson"
      copy={getEvaluationPortalCopy("chairperson")}
    />
  );
}
