"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Star } from "lucide-react";
import RatingSummaryCard from "@/components/faculty/RatingSummaryCard";
import AcademicYearSelect from "@/components/secretary/AcademicYearSelect";
import PortalPageLoader from "@/components/ui/PortalPageLoader";

type RatingBreakdown = {
  fiveStar: number;
  fourStar: number;
  threeStar: number;
  twoStar: number;
  oneStar: number;
};

type MyRatings = {
  evaluatorName: string;
  evaluatorRole: string;
  overallRating: number;
  breakdown: RatingBreakdown;
  totalRatings: number;
};

type TargetResult = {
  id: number;
  academicYear: string;
  averageRating: number;
  user: {
    id: number;
    name: string | null;
    email: string;
    role: string;
    department: string | null;
  };
};

type LeadershipResultsResponse = {
  academicYear: string;
  years: string[];
  myRatings: MyRatings;
  targetRatings: {
    averageRating: number;
    completionRate: number;
    completedCount: number;
    totalCount: number;
    results: TargetResult[];
  };
};

type TargetOption = {
  id: number;
  label: string;
  sublabel?: string;
};

type RoleResultsDashboardProps = {
  apiEndpoint: string;
  targetLabel: string;
  targetSectionLabel: string;
  targetPopulationLabel: string;
  targetSummaryDescription: string;
  emptyResultsMessage: string;
  initialMyRoleLabel: string;
};

function emptyMyRatings(initialMyRoleLabel: string): MyRatings {
  return {
    evaluatorName: initialMyRoleLabel,
    evaluatorRole: initialMyRoleLabel,
    overallRating: 0,
    breakdown: {
      fiveStar: 0,
      fourStar: 0,
      threeStar: 0,
      twoStar: 0,
      oneStar: 0,
    },
    totalRatings: 0,
  };
}

export default function RoleResultsDashboard({
  apiEndpoint,
  targetLabel,
  targetSectionLabel,
  targetPopulationLabel,
  targetSummaryDescription,
  emptyResultsMessage,
  initialMyRoleLabel,
}: RoleResultsDashboardProps) {
  const [academicYear, setAcademicYear] = useState("");
  const [years, setYears] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectedTargetId, setSelectedTargetId] = useState<number | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [targetOptions, setTargetOptions] = useState<TargetOption[]>([]);
  const [myRatings, setMyRatings] = useState<MyRatings>(emptyMyRatings(initialMyRoleLabel));
  const [targetResults, setTargetResults] = useState<TargetResult[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [completionRate, setCompletionRate] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTargetOptions = async () => {
      try {
        const res = await fetch("/api/evaluations/targets", { cache: "no-store" });
        const data = await res.json();

        if (!res.ok || !Array.isArray(data)) {
          throw new Error(`Failed to load ${targetLabel.toLowerCase()} suggestions`);
        }

        setTargetOptions(
          data.map(
            (target: { id: number; name: string | null; email: string; department: string | null }) => ({
              id: target.id,
              label: target.name || target.email,
              sublabel: target.department || target.email,
            })
          )
        );
      } catch (err) {
        console.error(err);
      }
    };

    fetchTargetOptions();
  }, [targetLabel]);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams();
        if (academicYear) {
          params.set("year", academicYear);
        }

        const res = await fetch(`${apiEndpoint}?${params.toString()}`, {
          cache: "no-store",
        });
        const data: LeadershipResultsResponse & { message?: string } = await res.json();

        if (!res.ok) {
          throw new Error(data.message || `Failed to load ${targetLabel.toLowerCase()} results`);
        }

        setAcademicYear(data.academicYear);
        setYears(data.years);
        setMyRatings(data.myRatings);
        setTargetResults(data.targetRatings.results);
        setAverageRating(data.targetRatings.averageRating);
        setCompletionRate(data.targetRatings.completionRate);
        setCompletedCount(data.targetRatings.completedCount);
        setTotalCount(data.targetRatings.totalCount);
      } catch (err) {
        setError(err instanceof Error ? err.message : `Failed to load ${targetLabel.toLowerCase()} results`);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [academicYear, apiEndpoint, targetLabel]);

  const filteredResults = useMemo(() => {
    if (selectedTargetId) {
      return targetResults.filter((result) => result.user.id === selectedTargetId);
    }

    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return targetResults;
    }

    return targetResults.filter((result) =>
      `${result.user.name || ""} ${result.user.email} ${result.user.department || ""}`
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [search, selectedTargetId, targetResults]);

  const filteredSuggestions = useMemo(() => {
    const normalized = searchInput.trim().toLowerCase();

    if (!normalized) {
      return targetOptions.slice(0, 8);
    }

    return targetOptions
      .filter((suggestion) =>
        `${suggestion.label} ${suggestion.sublabel || ""}`.toLowerCase().includes(normalized)
      )
      .slice(0, 8);
  }, [searchInput, targetOptions]);

  const renderStars = (rating: number) => {
    const fullStars = Math.round(rating);

    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={18}
            className={star <= fullStars ? "fill-[#f4c542] text-[#f4c542]" : "text-[#f4c542]"}
          />
        ))}
      </div>
    );
  };

  const handleSearch = () => {
    setSelectedTargetId(null);
    setSearch(searchInput.trim());
    setShowSuggestions(false);
  };

  const handleSuggestionSelect = (suggestion: TargetOption) => {
    setSearchInput(suggestion.label);
    setSearch(suggestion.label);
    setSelectedTargetId(suggestion.id);
    setShowSuggestions(false);
  };

  if (loading) {
    return (
      <PortalPageLoader
        title="View Evaluation Results"
        description={`Loading ${targetLabel.toLowerCase()} ratings, summaries, and filters...`}
        cards={2}
      />
    );
  }

  return (
    <main className="app-page-with-topbar">
      <div className="app-page-card max-w-[1600px]">
        <div className="border-b border-[#ece7f6] pb-5">
          <h1 className="text-[28px] font-extrabold leading-tight text-[#24135f]">
            View Evaluation Results
          </h1>
        </div>

        <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
          <AcademicYearSelect
            value={academicYear}
            options={years.length > 0 ? years : [academicYear || "No Years"]}
            onChange={setAcademicYear}
          />
        </div>

        {error ? (
          <div className="app-alert-danger mt-6">
            {error}
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <RatingSummaryCard
              title="My Ratings"
              evaluatorName={myRatings.evaluatorName}
              evaluatorRole={myRatings.evaluatorRole}
              overallRating={myRatings.overallRating}
              breakdown={myRatings.breakdown}
              totalRatings={myRatings.totalRatings}
            />

            <section className="rounded-[24px] border border-[#dddddd] bg-white p-5 shadow-[0_16px_36px_rgba(36,19,95,0.08)]">
              <h2 className="text-[22px] font-extrabold text-[#24135f]">
                {targetSectionLabel}
              </h2>
              <p className="mt-1 text-[13px] text-[#6c6684]">{targetSummaryDescription}</p>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="app-stat-card text-center sm:px-5">
                  <p className="text-[14px] font-bold text-[#24135f]">Average Rating</p>
                  <div className="mt-2 text-[38px] font-extrabold leading-none text-[#24135f]">
                    {averageRating.toFixed(2)}
                  </div>
                  <div className="mt-2 flex justify-center">{renderStars(averageRating)}</div>
                  <p className="mt-2 text-[12px] text-[#6c6684]">
                    Across all {targetPopulationLabel.toLowerCase()}
                  </p>
                </div>

                <div className="app-stat-card text-center sm:px-5">
                  <p className="text-[14px] font-bold text-[#24135f]">Completion Rate</p>
                  <div className="mt-2 text-[38px] font-extrabold leading-none text-[#24135f]">
                    {completionRate}%
                  </div>
                  <p className="mt-2 text-[12px] text-[#6c6684]">
                    {completedCount}/{totalCount || 0} completed
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="relative w-full">
                    <Search
                      size={18}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8e89aa]"
                    />
                    <input
                      type="text"
                      placeholder={`Search ${targetLabel}`}
                      value={searchInput}
                      onChange={(event) => {
                        setSearchInput(event.target.value);
                        setSelectedTargetId(null);

                        if (!event.target.value.trim()) {
                          setSearch("");
                        }
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          handleSearch();
                        }
                      }}
                      className="app-input h-[46px] rounded-[16px] pl-10 text-[15px]"
                    />

                    {showSuggestions && filteredSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 rounded-[18px] border border-[#d9d3e8] bg-white p-2 shadow-[0_18px_40px_rgba(36,19,95,0.14)]">
                        {filteredSuggestions.map((suggestion) => (
                          <button
                            key={suggestion.id}
                            type="button"
                            onMouseDown={(event) => {
                              event.preventDefault();
                              handleSuggestionSelect(suggestion);
                            }}
                            className="flex w-full flex-col rounded-[12px] px-3 py-2 text-left transition hover:bg-[#f8f6ff]"
                          >
                            <span className="text-[13px] font-semibold text-[#24135f]">
                              {suggestion.label}
                            </span>
                            {suggestion.sublabel && (
                              <span className="text-[11px] text-[#7b7498]">
                                {suggestion.sublabel}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleSearch}
                    className="app-btn-primary px-4 py-2 text-[13px]"
                  >
                    Search
                  </button>
                </div>
              </div>

              <div className="app-table-shell mt-4 hidden overflow-x-auto sm:block">
                <table className="w-full min-w-[620px] text-left">
                  <thead className="app-table-head">
                    <tr>
                      <th>{targetLabel}</th>
                      <th>Ratings</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {filteredResults.length > 0 ? (
                      filteredResults.map((result) => (
                        <tr key={result.id} className="app-table-row">
                          <td className="app-table-cell text-[15px] text-[#2f2a57]">
                            <p className="font-semibold text-[#24135f]">
                              {result.user.name || result.user.email}
                            </p>
                            <p className="mt-1 text-[13px] text-[#7d7d95]">
                              {result.user.department || "No department listed"}
                            </p>
                          </td>
                          <td className="app-table-cell">
                            <div className="flex items-center gap-3">
                              {renderStars(result.averageRating)}
                              <span className="text-[15px] font-semibold text-[#24135f]">
                                {result.averageRating.toFixed(2)}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={2} className="px-5 py-8 text-center text-[#7d7d95]">
                          {emptyResultsMessage}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 space-y-3 sm:hidden">
                {filteredResults.length > 0 ? (
                  filteredResults.map((result) => (
                    <article
                      key={result.id}
                      className="rounded-[18px] border border-[#dddddd] bg-white p-4 shadow-[0_12px_28px_rgba(36,19,95,0.06)]"
                    >
                      <p className="text-[15px] font-semibold text-[#24135f]">
                        {result.user.name || result.user.email}
                      </p>
                      <p className="mt-1 text-[13px] text-[#7d7d95]">
                        {result.user.department || "No department listed"}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        {renderStars(result.averageRating)}
                        <span className="text-[15px] font-semibold text-[#24135f]">
                          {result.averageRating.toFixed(2)}
                        </span>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="rounded-[18px] border border-[#dddddd] bg-white px-5 py-8 text-center text-[#7d7d95] shadow-[0_12px_28px_rgba(36,19,95,0.06)]">
                    {emptyResultsMessage}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
