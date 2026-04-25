"use client";

import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";

type AppSessionProviderProps = {
  children: React.ReactNode;
  session: Session | null;
};

export default function AppSessionProvider({
  children,
  session,
}: AppSessionProviderProps) {
  return (
    <SessionProvider
      session={session}
      refetchOnWindowFocus
      refetchWhenOffline={false}
      refetchInterval={5 * 60}
    >
      {children}
    </SessionProvider>
  );
}
