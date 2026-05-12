import { redirect } from "next/navigation";
import { getAppSession, getDefaultRouteForRole } from "@/lib/server-auth";

export default async function Home() {
  const session = await getAppSession();

  if (!session) {
    redirect("/login");
  }

  redirect(getDefaultRouteForRole(session));
}
