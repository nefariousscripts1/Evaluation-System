import RoleEvaluationPortal from "@/components/evaluation/RoleEvaluationPortal";
import { getEvaluationPortalCopy } from "@/lib/role-evaluation";

export default function DirectorEvaluatePage() {
  return (
    <RoleEvaluationPortal
      allowedRole="director"
      copy={getEvaluationPortalCopy("director")}
    />
  );
}
