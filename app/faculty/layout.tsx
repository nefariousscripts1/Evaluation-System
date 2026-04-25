import { requirePageRole } from "@/lib/server-auth";

export default async function FacultyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePageRole(["faculty"]);
  return children;
}
