import { requirePageRole } from "@/lib/server-auth";

export default async function SecretaryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePageRole(["secretary"]);
  return children;
}
