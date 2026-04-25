"use client";

import { useEffect } from "react";
import { getSession, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ProtectedSessionMonitor() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      router.refresh();
    }
  }, [router, status]);

  useEffect(() => {
    const validateSession = async () => {
      const session = await getSession();

      if (!session) {
        router.replace("/login");
        router.refresh();
      }
    };

    const handlePageShow = () => {
      void validateSession();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void validateSession();
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [router]);

  return null;
}
