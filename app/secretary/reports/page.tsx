"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Search, Star, ChevronDown } from "lucide-react";
import PortalPageLoader from "@/components/ui/PortalPageLoader";

interface Result {
  id: number;
  user: {
    name: string;
    email: string;
    role: string;
  };
  academicYear: string;
  averageRating: number;
}

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [years, setYears] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [academicYear, setAcademicYear] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      // allow secretary
      if (session?.user?.role !== "secretary" && session?.user?.role !== "admin") {
        router.push("/unauthorized");
        return;
      }

      fetchData();
    }
  }, [status, session, academicYear]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (academicYear) params.append("academicYear", academicYear);

      const res = await fetch(`/api/reports?${params.toString()}`, {
        cache: "no-store",
      });

      const data = await res.json();

      setResults(data.results || []);
      setYears(data.years || []);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
      setResults([]);
      setYears([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = useMemo(() => {
    return results.filter((item) =>
      (item.user?.name || item.user?.email || "")
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [results, search]);

  const averageRating = useMemo(() => {
    if (filteredResults.length === 0) return 0;
    const total = filteredResults.reduce((sum, item) => sum + item.averageRating, 0);
    return total / filteredResults.length;
  }, [filteredResults]);

  // placeholder metric style like design
  const completedCount = filteredResults.length;
  const totalCount = filteredResults.length || 1;
  const completionRate = completedCount
    ? Math.round((completedCount / totalCount) * 100)
    : 0;

  const renderStars = (rating: number) => {
    const fullStars = Math.round(rating);

    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={20}
            className={
              star <= fullStars
                ? "fill-[#f4c542] text-[#f4c542]"
                : "text-[#f4c542]"
            }
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <PortalPageLoader
        title="View Evaluation Results"
        description="Loading instructor results, academic years, and summary metrics..."
        cards={1}
        compact
      />
    );
  }

  return (
    <main className="app-page-with-topbar">
      <div className="app-page-card max-w-[1380px]">
        {/* Header */}
        <div className="border-b border-[#ece7f6] pb-5">
          <div className="flex items-start gap-4">
            <div className="mt-1 h-[52px] w-[8px] bg-[#24135f]" />
            <div>
              <h1 className="text-[26px] font-extrabold leading-none text-[#24135f] md:text-[30px]">
                View Evaluation Results
              </h1>
              <p className="mt-1 text-[15px] text-[#4b4b68]">
                Summary of student evaluations for instructors
              </p>
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="mt-8 grid grid-cols-1 gap-4 md:mt-10 md:grid-cols-2 md:gap-6">
          <div className="app-stat-card text-center">
            <h2 className="text-[22px] font-extrabold text-[#24135f]">
              Average Rating
            </h2>
            <div className="mt-1 text-[58px] font-extrabold leading-none text-[#24135f]">
              {averageRating.toFixed(2)}
            </div>
            <div className="mt-2 flex justify-center">
              {renderStars(averageRating)}
            </div>
            <p className="mt-2 text-[14px] text-[#403a68]">
              Across all the instructors
            </p>
          </div>

          <div className="app-stat-card text-center">
            <h2 className="text-[22px] font-extrabold text-[#24135f]">
              Completion Rate
            </h2>
            <div className="mt-1 text-[58px] font-extrabold leading-none text-[#24135f]">
              {completionRate}%
            </div>
            <p className="mt-4 text-[14px] text-[#403a68]">
              {completedCount}/{totalCount} Completed
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-[420px]">
            <Search
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8e89aa]"
            />
            <input
              type="text"
              placeholder="Search Instuctor"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="app-input h-[46px] rounded-[16px] pl-10 text-[15px]"
            />
          </div>

          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
            <label className="text-[15px] font-bold text-black">
              Select Academic Year:
            </label>

            <div className="relative w-full min-w-0 md:min-w-[165px]">
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="app-select h-[46px] rounded-[16px] text-[15px]"
              >
                <option value="">All Years</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#24135f]"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="app-table-shell mt-4 hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[620px] text-left">
            <thead className="app-table-head">
              <tr>
                <th>Instructor</th>
                <th>Rating</th>
              </tr>
            </thead>

            <tbody className="bg-white">
              {filteredResults.length > 0 ? (
                filteredResults.map((item) => (
                  <tr key={item.id} className="app-table-row">
                    <td className="app-table-cell text-[15px] text-[#2f2a57]">
                      {item.user?.name || item.user?.email}
                    </td>
                    <td className="app-table-cell">
                      <div className="flex items-center gap-3">
                        {renderStars(item.averageRating)}
                        <span className="text-[15px] font-semibold text-[#24135f]">
                          {item.averageRating.toFixed(2)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={2}
                    className="px-5 py-8 text-center text-[#7d7d95]"
                  >
                    No evaluation results found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 space-y-3 sm:hidden">
          {filteredResults.length > 0 ? (
            filteredResults.map((item) => (
              <article
                key={item.id}
                className="rounded-[18px] border border-[#dddddd] bg-white p-4 shadow-[0_12px_28px_rgba(36,19,95,0.06)]"
              >
                <p className="text-[15px] font-semibold text-[#24135f]">
                  {item.user?.name || item.user?.email}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {renderStars(item.averageRating)}
                  <span className="text-[15px] font-semibold text-[#24135f]">
                    {item.averageRating.toFixed(2)}
                  </span>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-[18px] border border-[#dddddd] bg-white px-5 py-8 text-center text-[#7d7d95] shadow-[0_12px_28px_rgba(36,19,95,0.06)]">
              No evaluation results found.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
