"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardContent from "./DashboardContent";
import { getErrorMessage } from "@/lib/error-message";

type DashboardPayload = React.ComponentProps<typeof DashboardContent>;

export default function SecretaryDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState<DashboardPayload | null>(null);
  const errorMessage = error ? getErrorMessage(error) : "";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session?.user?.role !== "secretary") {
      router.push("/login");
      return;
    }

    if (status !== "authenticated" || session?.user?.role !== "secretary") {
      return;
    }

    const controller = new AbortController();

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("/api/secretary/dashboard", {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = await res.json().catch(() => null);

        if (!res.ok || !data) {
          throw new Error(data?.error || "Failed to load dashboard data");
        }

        setPayload(data as DashboardPayload);
      } catch (fetchError) {
        if (controller.signal.aborted) {
          return;
        }

        console.error("Secretary dashboard fetch error:", fetchError);
        setError(
          fetchError instanceof Error ? fetchError.message : "Failed to load dashboard data"
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void loadDashboard();

    return () => controller.abort();
  }, [status, session?.user?.role, router]);

  if (loading) {
    return <div className="p-8 text-center text-[#24135f]">Loading...</div>;
  }

  if (error) {
    return (
      <main className="px-4 py-4 sm:px-5 sm:py-6">
        <div className="mx-auto max-w-[1750px] rounded-[18px] border border-red-200 bg-red-50 p-6 text-red-800">
          <h1 className="text-[24px] font-extrabold">Dashboard unavailable</h1>
          <p className="mt-2 text-sm">{errorMessage}</p>
        </div>
      </main>
    );
  }

  if (!payload) {
    return null;
  }

  return <DashboardContent {...payload} />;
}
