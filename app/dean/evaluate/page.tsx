import RoleEvaluationPortal from "@/components/evaluation/RoleEvaluationPortal";
import { getEvaluationPortalCopy } from "@/lib/role-evaluation";

export default function DeanEvaluatePage() {
  return (
    <RoleEvaluationPortal
      allowedRole="dean"
      copy={getEvaluationPortalCopy("dean")}
    />
  );
}
