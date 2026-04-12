import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function EvaluateRedirectPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  switch (session.user.role) {
    case "student":
      redirect("/student/evaluate");
    case "chairperson":
      redirect("/chairperson/evaluate");
    case "dean":
      redirect("/dean/evaluate");
    case "director":
      redirect("/director/evaluate");
    case "campus_director":
      redirect("/campus-director/evaluate");
    default:
      redirect("/unauthorized");
  }
}
