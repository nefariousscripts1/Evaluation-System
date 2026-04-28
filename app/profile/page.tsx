import ProfilePageClient from "./ProfilePageClient";
import type { AppRole } from "@/lib/server-auth";
import { requirePageSession } from "@/lib/server-auth";

export default async function ProfilePage() {
  const session = await requirePageSession();

  return (
    <ProfilePageClient
      user={{
        name: session.user.name ?? null,
        email: session.user.email,
        role: session.user.role as AppRole,
      }}
    />
  );
}
