"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardContent from "./DashboardContent";
import PortalPageLoader from "@/components/ui/PortalPageLoader";
import { getApiErrorMessage, readApiResponse } from "@/lib/client-api";

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
        const data = await readApiResponse<DashboardPayload>(res);

        setPayload(data as DashboardPayload);
      } catch (fetchError) {
        if (controller.signal.aborted) {
          return;
        }

        console.error("Secretary dashboard fetch error:", fetchError);
        setError(getApiErrorMessage(fetchError, "Failed to load dashboard data"));
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
    return (
      <PortalPageLoader
        title="Secretary Dashboard"
        description="Loading summary cards, faculty activity, and schedule snapshots..."
        cards={4}
      />
    );
  }

  if (error) {
    return <DashboardContent {...(payload ?? emptyPayload)} />;
  }

  if (!payload) {
    return null;
  }

  return <DashboardContent {...payload} />;
}
