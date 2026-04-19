"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardContent from "./DashboardContent";

type DashboardPayload = React.ComponentProps<typeof DashboardContent>;

const emptyPayload: DashboardPayload = {
  totalStudents: 0,
  totalFaculty: 0,
  totalQuestionnaires: 0,
  displaySchedules: [],
  latestQuestionnaires: [],
  latestFaculty: [],
};

export default function SecretaryDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState<DashboardPayload | null>(null);

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
        console.log("Dashboard API status:", res.status, data);

        if (!data) {
          throw new Error(data?.error || "Failed to load dashboard data");
        }

        setPayload(data as DashboardPayload);
        if (!res.ok && data.error) {
          setError(data.error);
        }
      } catch (fetchError) {
        if (controller.signal.aborted) {
          return;
        }

        console.error("Secretary dashboard fetch error:", fetchError);
        setError(
          fetchError instanceof Error ? fetchError.message : "Failed to load dashboard data"
        );
        setPayload(emptyPayload);
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
    return <DashboardContent {...(payload ?? emptyPayload)} />;
  }

  if (!payload) {
    return null;
  }

  return <DashboardContent {...payload} />;
}
