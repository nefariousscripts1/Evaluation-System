import RoleEvaluationPortal from "@/components/evaluation/RoleEvaluationPortal";
import { getEvaluationPortalCopy } from "@/lib/role-evaluation";

export default function CampusDirectorEvaluatePage() {
  return (
    <RoleEvaluationPortal
      allowedRole="campus_director"
      copy={getEvaluationPortalCopy("campus_director")}
    />
  );
}
