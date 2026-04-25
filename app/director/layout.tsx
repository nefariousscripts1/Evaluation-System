import { requirePageRole } from "@/lib/server-auth";

export default async function DirectorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePageRole(["director"]);
  return children;
}
