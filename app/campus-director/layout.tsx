import { requirePageRole } from "@/lib/server-auth";

export default async function CampusDirectorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePageRole(["campus_director"]);
  return children;
}
