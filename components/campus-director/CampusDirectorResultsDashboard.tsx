"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Star } from "lucide-react";
import AcademicYearSelect from "@/components/secretary/AcademicYearSelect";
import AppSelect from "@/components/ui/AppSelect";
import PortalPageLoader from "@/components/ui/PortalPageLoader";
import { getApiErrorMessage, readApiResponse } from "@/lib/client-api";
import {
  getCampusDirectorRoleFilterLabel,
  getCampusDirectorRoleFilterPluralLabel,
  getCampusDirectorRoleOptions,
  getReportableRoleLabel,
  type CampusDirectorRoleFilter,
} from "@/lib/reporting-roles";

type TargetOption = {
  id: number;
  label: string;
  sublabel?: string;
};

type ResultItem = {
  id: number;
  averageRating: number;
  user: {
    id: number;
    name: string | null;
    email: string;
    role: string;
    department: string | null;
  };
};

type CampusDirectorResultsResponse = {
  academicYear: string;
  years: string[];
  role: CampusDirectorRoleFilter;
  averageRating: number;
  completionRate: number;
  completedCount: number;
  totalCount: number;
  results: ResultItem[];
};

const roleOptions = getCampusDirectorRoleOptions();

export default function CampusDirectorResultsDashboard() {
  const [academicYear, setAcademicYear] = useState("");
  const [years, setYears] = useState<string[]>([]);
  const [role, setRole] = useState<CampusDirectorRoleFilter>("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectedTargetId, setSelectedTargetId] = useState<number | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [targetOptions, setTargetOptions] = useState<TargetOption[]>([]);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [completionRate, setCompletionRate] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const hasLoadedOnceRef = useRef(false);

  useEffect(() => {
    const fetchTargetOptions = async () => {
      try {
        const params = new URLSearchParams({ role });
        const res = await fetch(`/api/campus-director/targets?${params.toString()}`, {
          cache: "no-store",
        });
        const data = await readApiResponse<
          Array<{
            id: number;
            name: string | null;
            email: string;
            department: string | null;
            roleLabel: string;
          }>
        >(res);

        setTargetOptions(
          data.map(
            (target: {
              id: number;
              name: string | null;
              email: string;
              department: string | null;
              roleLabel: string;
            }) => ({
              id: target.id,
              label: target.name || target.email,
              sublabel: [target.roleLabel, target.department || target.email].filter(Boolean).join(" • "),
            })
          )
        );
      } catch (err) {
        console.error(err);
        setTargetOptions([]);
      }
    };

    setSearchInput("");
    setSearch("");
    setSelectedTargetId(null);
    setShowSuggestions(false);
    fetchTargetOptions();
  }, [role]);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams({ role });
        if (academicYear) {
          params.set("year", academicYear);
        }

        const res = await fetch(`/api/campus-director/results?${params.toString()}`, {
          cache: "no-store",
        });
        const data = await readApiResponse<CampusDirectorResultsResponse>(res);

        setAcademicYear(data.academicYear);
        setYears(data.years.length > 0 ? data.years : [data.academicYear]);
        setResults(data.results || []);
        setAverageRating(data.averageRating || 0);
        setCompletionRate(data.completionRate || 0);
        setCompletedCount(data.completedCount || 0);
        setTotalCount(data.totalCount || 0);
        hasLoadedOnceRef.current = true;
      } catch (err) {
        setError(getApiErrorMessage(err, "Failed to load campus director results"));
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [academicYear, role]);

  const filteredResults = useMemo(() => {
    if (selectedTargetId) {
      return results.filter((result) => result.user.id === selectedTargetId);
    }

    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) {
      return results;
    }

    return results.filter((result) =>
      [
        result.user.name || "",
        result.user.email,
        result.user.department || "",
        getReportableRoleLabel(result.user.role),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [results, search, selectedTargetId]);

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
            size={16}
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

  if (loading && !hasLoadedOnceRef.current) {
    return (
      <PortalPageLoader
        title="View Evaluation Results"
        description="Loading campus-wide evaluation ratings, role filters, and searchable results..."
        cards={1}
        compact
      />
    );
  }

  return (
    <main className="app-page-with-topbar">
      <div className="app-page-card max-w-[1600px]">
        <div className="border-b border-[#ece7f6] pb-4">
          <h1 className="text-[28px] font-extrabold leading-tight text-[#24135f]">
            View Evaluation Results
          </h1>
          <p className="mt-1 text-[13px] text-[#6c6684]">
            Campus director access to evaluation ratings across all evaluated roles.
          </p>
        </div>

        {error ? (
          <div className="app-alert-danger mt-6">{error}</div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="app-stat-card text-center sm:px-5">
                <p className="text-[14px] font-bold text-[#24135f]">Average Rating</p>
                <div className="mt-2 text-[38px] font-extrabold leading-none text-[#24135f]">
                  {averageRating.toFixed(2)}
                </div>
                <div className="mt-2 flex justify-center">{renderStars(averageRating)}</div>
                <p className="mt-2 text-[12px] text-[#6c6684]">
                  Across all {getCampusDirectorRoleFilterPluralLabel(role)}
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

            <div className="mt-6 grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)_220px]">
              <div>
                <AppSelect
                  value={role}
                  onChange={(nextValue) => setRole(nextValue as CampusDirectorRoleFilter)}
                  options={roleOptions}
                  triggerClassName="min-h-[44px] rounded-[16px] text-[13px]"
                />
              </div>

              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative w-full">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8e89aa]"
                  />
                  <input
                    type="text"
                    placeholder={`Search ${getCampusDirectorRoleFilterLabel(role)}`}
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
                    className="app-input h-[44px] rounded-[16px] pl-9 text-[13px]"
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
                  className="app-btn-secondary px-4 py-2 text-[13px]"
                >
                  Search
                </button>
              </div>

              <div className="w-full">
                <AcademicYearSelect
                  value={academicYear}
                  options={years.length > 0 ? years : [academicYear || "No Years"]}
                  onChange={setAcademicYear}
                  hideLabel
                  className="justify-end"
                />
              </div>
            </div>

            <div className="app-table-shell mt-4 hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[760px] text-left">
                <thead className="app-table-head">
                  <tr>
                    <th>Evaluatee</th>
                    <th>Role</th>
                    <th>Rating</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {filteredResults.length > 0 ? (
                    filteredResults.map((result) => (
                      <tr key={result.id} className="app-table-row">
                        <td className="app-table-cell text-[14px] text-[#2f2a57]">
                          {result.user.name || result.user.email}
                        </td>
                        <td className="app-table-cell text-[14px] text-[#2f2a57]">
                          {getReportableRoleLabel(result.user.role)}
                        </td>
                        <td className="app-table-cell">
                          <div className="flex items-center gap-3">
                            {renderStars(result.averageRating)}
                            <span className="text-[14px] font-semibold text-[#24135f]">
                              {result.averageRating.toFixed(2)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-5 py-8 text-center text-[#7d7d95]">
                        No evaluation results found for the selected filter.
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
                    <p className="mt-1 text-[13px] text-[#6c6684]">
                      {getReportableRoleLabel(result.user.role)}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      {renderStars(result.averageRating)}
                      <span className="text-[14px] font-semibold text-[#24135f]">
                        {result.averageRating.toFixed(2)}
                      </span>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-[18px] border border-[#dddddd] bg-white px-5 py-8 text-center text-[#7d7d95] shadow-[0_12px_28px_rgba(36,19,95,0.06)]">
                  No evaluation results found for the selected filter.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
