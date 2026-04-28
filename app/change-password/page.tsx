import ChangePasswordPageClient from "./ChangePasswordPageClient";
import { requirePageSession } from "@/lib/server-auth";

export default async function ChangePasswordPage() {
  await requirePageSession();
  return <ChangePasswordPageClient />;
}
