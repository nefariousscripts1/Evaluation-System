import { requirePageRole } from "@/lib/server-auth";

export default async function ChairpersonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePageRole(["chairperson"]);
  return children;
}
