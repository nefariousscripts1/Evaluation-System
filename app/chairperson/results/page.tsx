"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Star } from "lucide-react";
import RatingSummaryCard from "@/components/faculty/RatingSummaryCard";
import AcademicYearSelect from "@/components/secretary/AcademicYearSelect";

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

type FacultyResult = {
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

type ChairpersonResultsResponse = {
  academicYear: string;
  years: string[];
  myRatings: MyRatings;
  facultyRatings: {
    averageRating: number;
    completionRate: number;
    completedCount: number;
    totalCount: number;
    results: FacultyResult[];
  };
};

type FacultyOption = {
  id: number;
  label: string;
  sublabel?: string;
};

function emptyMyRatings(): MyRatings {
  return {
    evaluatorName: "Chairperson",
    evaluatorRole: "Chairperson",
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

export default function ChairpersonResultsPage() {
  const [academicYear, setAcademicYear] = useState("");
  const [years, setYears] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectedFacultyId, setSelectedFacultyId] = useState<number | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [facultyOptions, setFacultyOptions] = useState<FacultyOption[]>([]);
  const [myRatings, setMyRatings] = useState<MyRatings>(emptyMyRatings());
  const [facultyResults, setFacultyResults] = useState<FacultyResult[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [completionRate, setCompletionRate] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchFacultyOptions = async () => {
      try {
        const res = await fetch("/api/evaluations/targets", { cache: "no-store" });
        const data = await res.json();

        if (!res.ok || !Array.isArray(data)) {
          throw new Error("Failed to load faculty suggestions");
        }

        setFacultyOptions(
          data.map((faculty: { id: number; name: string | null; email: string; department: string | null }) => ({
            id: faculty.id,
            label: faculty.name || faculty.email,
            sublabel: faculty.department || faculty.email,
          }))
        );
      } catch (err) {
        console.error(err);
      }
    };

    fetchFacultyOptions();
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams();
        if (academicYear) {
          params.set("year", academicYear);
        }

        const res = await fetch(`/api/chairperson/results?${params.toString()}`, {
          cache: "no-store",
        });
        const data: ChairpersonResultsResponse & { message?: string } = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to load chairperson evaluation results");
        }

        setAcademicYear(data.academicYear);
        setYears(data.years);
        setMyRatings(data.myRatings);
        setFacultyResults(data.facultyRatings.results);
        setAverageRating(data.facultyRatings.averageRating);
        setCompletionRate(data.facultyRatings.completionRate);
        setCompletedCount(data.facultyRatings.completedCount);
        setTotalCount(data.facultyRatings.totalCount);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load chairperson evaluation results"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [academicYear]);

  const filteredResults = useMemo(() => {
    if (selectedFacultyId) {
      return facultyResults.filter((result) => result.user.id === selectedFacultyId);
    }

    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return facultyResults;
    }

    return facultyResults.filter((result) =>
      `${result.user.name || ""} ${result.user.email} ${result.user.department || ""}`
        .toLowerCase()
      .includes(normalizedSearch)
    );
  }, [facultyResults, search, selectedFacultyId]);

  const filteredSuggestions = useMemo(() => {
    const normalized = searchInput.trim().toLowerCase();

    if (!normalized) {
      return facultyOptions.slice(0, 8);
    }

    return facultyOptions
      .filter((suggestion) =>
        `${suggestion.label} ${suggestion.sublabel || ""}`.toLowerCase().includes(normalized)
      )
      .slice(0, 8);
  }, [facultyOptions, searchInput]);

  const renderStars = (rating: number) => {
    const fullStars = Math.round(rating);

    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={18}
            className={
              star <= fullStars ? "fill-[#f4c542] text-[#f4c542]" : "text-[#f4c542]"
            }
          />
        ))}
      </div>
    );
  };

  const handleSearch = () => {
    setSelectedFacultyId(null);
    setSearch(searchInput.trim());
    setShowSuggestions(false);
  };

  const handleSuggestionSelect = (suggestion: FacultyOption) => {
    setSearchInput(suggestion.label);
    setSearch(suggestion.label);
    setSelectedFacultyId(suggestion.id);
    setShowSuggestions(false);
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
        <div className="border-b border-[#8e8e8e] pb-5">
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
          <div className="mt-6 rounded-[10px] border border-red-200 bg-red-50 p-4 text-red-700">
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

            <section className="rounded-[18px] border border-[#dddddd] bg-white p-5">
              <h2 className="text-[22px] font-extrabold text-[#24135f]">Faculty Ratings</h2>
              <p className="mt-1 text-[13px] text-[#6c6684]">
                Summary of faculty evaluations for the selected academic year.
              </p>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-[12px] border border-[#e8e4f3] bg-white px-5 py-4 text-center">
                  <p className="text-[14px] font-bold text-[#24135f]">Average Rating</p>
                  <div className="mt-2 text-[38px] font-extrabold leading-none text-[#24135f]">
                    {averageRating.toFixed(2)}
                  </div>
                  <div className="mt-2 flex justify-center">{renderStars(averageRating)}</div>
                  <p className="mt-2 text-[12px] text-[#6c6684]">Across all faculty</p>
                </div>

                <div className="rounded-[12px] border border-[#e8e4f3] bg-white px-5 py-4 text-center">
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
                    placeholder="Search Faculty"
                    value={searchInput}
                    onChange={(event) => {
                      setSearchInput(event.target.value);
                      setSelectedFacultyId(null);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleSearch();
                      }
                    }}
                    className="h-[42px] w-full rounded-[4px] border border-[#8e83b5] bg-white pl-10 pr-4 text-[15px] text-[#24135f] outline-none focus:border-[#24135f] focus:ring-1 focus:ring-[#24135f]"
                  />

                  {showSuggestions && filteredSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 rounded-[8px] border border-[#d9d3e8] bg-white shadow-lg">
                      {filteredSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.id}
                          type="button"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            handleSuggestionSelect(suggestion);
                          }}
                          className="flex w-full flex-col px-3 py-2 text-left transition hover:bg-[#f8f6ff]"
                        >
                          <span className="text-[13px] font-semibold text-[#24135f]">
                            {suggestion.label}
                          </span>
                          {suggestion.sublabel && (
                            <span className="text-[11px] text-[#7b7498]">{suggestion.sublabel}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                  </div>

                  <button
                    type="button"
                    onClick={handleSearch}
                    className="rounded-[4px] bg-[#24135f] px-4 py-2 text-[13px] font-bold text-white transition hover:bg-[#1b0f4d]"
                  >
                    Search
                  </button>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto rounded-[4px] border border-[#dddddd]">
                <table className="w-full min-w-[620px] text-left">
                  <thead className="bg-[#24135f] text-white">
                    <tr>
                      <th className="px-5 py-4 text-[18px] font-bold">Faculty</th>
                      <th className="px-5 py-4 text-[18px] font-bold">Ratings</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {filteredResults.length > 0 ? (
                      filteredResults.map((result) => (
                        <tr key={result.id} className="border-t border-[#e7e7e7]">
                          <td className="px-5 py-5 text-[15px] text-[#2f2a57]">
                            <p className="font-semibold text-[#24135f]">
                              {result.user.name || result.user.email}
                            </p>
                            <p className="mt-1 text-[13px] text-[#7d7d95]">
                              {result.user.department || "No department listed"}
                            </p>
                          </td>
                          <td className="px-5 py-5">
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
                        <td
                          colSpan={2}
                          className="px-5 py-8 text-center text-[#7d7d95]"
                        >
                          No faculty evaluation results found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
