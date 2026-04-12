"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Search, Star, ChevronDown } from "lucide-react";

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
      <main className="px-4 py-4 sm:px-5 sm:py-6">
        <div className="mx-auto max-w-[1380px] rounded-[18px] border border-[#dddddd] bg-white p-6 text-center text-[#24135f] sm:p-8">
          Loading evaluation results...
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 py-4 sm:px-5 sm:py-6">
      <div className="mx-auto max-w-[1380px] rounded-[10px] border border-[#dddddd] bg-white px-4 py-5 sm:px-8 sm:py-6">
        {/* Header */}
        <div className="border-b border-[#8e8e8e] pb-5">
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
          <div className="rounded-[6px] border border-[#e3e3e3] bg-white px-6 py-5 text-center">
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

          <div className="rounded-[6px] border border-[#e3e3e3] bg-white px-6 py-5 text-center">
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
              className="h-[42px] w-full rounded-[4px] border border-[#8e83b5] bg-white pl-10 pr-4 text-[15px] text-[#24135f] outline-none focus:border-[#24135f] focus:ring-1 focus:ring-[#24135f]"
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
                className="h-[42px] w-full appearance-none rounded-[2px] border border-[#8e83b5] bg-white px-4 pr-10 text-[15px] font-semibold text-[#24135f] outline-none"
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
        <div className="mt-4 overflow-x-auto rounded-[4px] border border-[#dddddd]">
          <table className="w-full min-w-[620px] text-left">
            <thead className="bg-[#24135f] text-white">
              <tr>
                <th className="px-5 py-4 text-[18px] font-bold">Instructor</th>
                <th className="px-5 py-4 text-[18px] font-bold">Rating</th>
              </tr>
            </thead>

            <tbody className="bg-white">
              {filteredResults.length > 0 ? (
                filteredResults.map((item) => (
                  <tr key={item.id} className="border-t border-[#e7e7e7]">
                    <td className="px-5 py-5 text-[15px] text-[#2f2a57]">
                      {item.user?.name || item.user?.email}
                    </td>
                    <td className="px-5 py-5">
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
      </div>
    </main>
  );
}
