import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }

  const role = session.user.role;
  
  if (role === "secretary") {
    redirect("/secretary/dashboard");
  } else if (role === "student") {
    redirect("/student/evaluate");
  } else if (role === "faculty") {
    redirect("/faculty/dashboard");
  } else if (role === "chairperson") {
    redirect("/chairperson/results");
  } else if (role === "dean") {
    redirect("/dean/evaluate");
  } else if (role === "director") {
    redirect("/director/evaluate");
  } else if (role === "campus_director") {
    redirect("/campus-director/evaluate");
  } else {
    redirect("/login");
  }
}
