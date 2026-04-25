import { requirePageRole } from "@/lib/server-auth";

export default async function DeanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePageRole(["dean"]);
  return children;
}
