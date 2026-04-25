import { requirePageRole } from "@/lib/server-auth";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePageRole(["student"]);
  return children;
}
