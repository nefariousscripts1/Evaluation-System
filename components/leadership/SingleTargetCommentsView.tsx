"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, UserRound } from "lucide-react";
import AcademicYearSelect from "@/components/secretary/AcademicYearSelect";
import PaginationControls from "@/components/secretary/PaginationControls";
import SummaryCommentsTable, {
  SummaryComment,
} from "@/components/secretary/SummaryCommentsTable";
import InlineLoadingIndicator from "@/components/ui/InlineLoadingIndicator";
import PortalPageLoader from "@/components/ui/PortalPageLoader";
import { getApiErrorMessage, readApiResponse } from "@/lib/client-api";

type SingleTargetCommentsResponse = {
  academicYear: string;
  years: string[];
  semesters: string[];
  semester: string;
  selectedTarget: {
    id: number;
    name: string;
    label: string;
  } | null;
  comments: SummaryComment[];
  total: number;
};

type TargetOption = {
  id: number;
  label: string;
  sublabel?: string;
};

type SingleTargetCommentsViewProps = {
  apiEndpoint: string;
  title: string;
  targetLabel: string;
  searchPlaceholder: string;
};

const pageSize = 5;

export default function SingleTargetCommentsView({
  apiEndpoint,
  title,
  targetLabel,
  searchPlaceholder,
}: SingleTargetCommentsViewProps) {
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTargetId, setSelectedTargetId] = useState<number | null>(null);
  const [targetOptions, setTargetOptions] = useState<TargetOption[]>([]);
  const [academicYear, setAcademicYear] = useState("");
  const [academicYearOptions, setAcademicYearOptions] = useState<string[]>([]);
  const [semester, setSemester] = useState("all");
  const [page, setPage] = useState(1);
  const [comments, setComments] = useState<SummaryComment[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<SingleTargetCommentsResponse["selectedTarget"]>(null);
  const [totalComments, setTotalComments] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const hasLoadedOnceRef = useRef(false);

  useEffect(() => {
    const fetchTargetOptions = async () => {
      try {
        const res = await fetch("/api/evaluations/targets", { cache: "no-store" });
        const data = await readApiResponse<
          Array<{
            id: number;
            name: string | null;
            email: string;
            department: string | null;
          }>
        >(res);

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
    const fetchComments = async () => {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(pageSize),
          semester,
        });

        if (searchTerm) {
          params.set("search", searchTerm);
        }

        if (selectedTargetId) {
          params.set("targetId", String(selectedTargetId));
        }

        if (academicYear) {
          params.set("academicYear", academicYear);
        }

        const res = await fetch(`${apiEndpoint}?${params.toString()}`, {
          cache: "no-store",
        });
        const data = await readApiResponse<SingleTargetCommentsResponse>(res);

        setAcademicYear(data.academicYear);
        setAcademicYearOptions(data.years.length > 0 ? data.years : [data.academicYear]);
        setSemester(data.semester);
        setSelectedTarget(data.selectedTarget);
        setComments(data.comments || []);
        setTotalComments(data.total || 0);
        hasLoadedOnceRef.current = true;
      } catch (err) {
        setError(getApiErrorMessage(err, `Failed to load ${targetLabel.toLowerCase()} comments`));
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [academicYear, apiEndpoint, page, searchTerm, selectedTargetId, semester, targetLabel]);

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

  const startIndex = (page - 1) * pageSize;
  const startDisplay = totalComments === 0 ? 0 : startIndex + 1;
  const endDisplay = Math.min(startIndex + pageSize, totalComments);
  const totalPages = Math.max(1, Math.ceil(totalComments / pageSize));

  const handleSearch = () => {
    setPage(1);
    setSearchTerm(searchInput.trim());
    setShowSuggestions(false);
  };

  const handleSuggestionSelect = (suggestion: TargetOption) => {
    setSearchInput(suggestion.label);
    setSearchTerm(suggestion.label);
    setSelectedTargetId(suggestion.id);
    setPage(1);
    setShowSuggestions(false);
  };

  if (loading && !hasLoadedOnceRef.current) {
    return (
      <PortalPageLoader
        title={title}
        description={`Loading ${targetLabel.toLowerCase()} comments, filters, and search suggestions...`}
        cards={1}
        compact
      />
    );
  }

  return (
    <main className="app-page-with-topbar">
      <div className="app-page-card max-w-[1600px]">
        <div className="pb-5">
          <h1 className="text-[28px] font-extrabold leading-tight text-[#24135f]">{title}</h1>
        </div>

        {error ? (
          <div className="app-alert-danger">
            {error}
          </div>
        ) : (
          <section className="rounded-[24px] border border-[#dddddd] bg-white p-4 shadow-[0_14px_34px_rgba(36,19,95,0.06)] sm:p-6">
            <div className="flex flex-col gap-5 border-b border-[#ece7f6] pb-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#ebdbff] text-[#5c4599]">
                  <UserRound size={34} />
                </div>
                <div>
                  <p className="text-[18px] font-bold leading-tight text-[#191919]">
                    {selectedTarget?.name || "DOI"}
                  </p>
                  <p className="text-[14px] leading-tight text-[#191919]">
                    {selectedTarget?.label || targetLabel}
                  </p>
                </div>
              </div>

              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto">
                <div className="relative w-full sm:w-[220px]">
                  <Search
                    size={14}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8e89aa]"
                  />
                  <input
                    type="text"
                    value={searchInput}
                    placeholder={searchPlaceholder}
                    onChange={(event) => {
                      setSearchInput(event.target.value);
                      setSelectedTargetId(null);

                      if (!event.target.value.trim()) {
                        setPage(1);
                        setSearchTerm("");
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

                <div className="w-full sm:w-[190px]">
                  <AcademicYearSelect
                    value={academicYear}
                    options={academicYearOptions.length > 0 ? academicYearOptions : [academicYear || "No Years"]}
                    onChange={(value) => {
                      setAcademicYear(value);
                      setPage(1);
                    }}
                    hideLabel
                    className="justify-end"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-[18px]">
              <div className="border-b border-[#ece7f6] px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-[16px] font-bold text-[#24135f]">Comments list</h3>
                  {loading && hasLoadedOnceRef.current && (
                    <InlineLoadingIndicator label="Refreshing comments..." />
                  )}
                </div>
              </div>
              <SummaryCommentsTable comments={comments} startIndex={startDisplay} />
              <PaginationControls
                start={startDisplay}
                end={endDisplay}
                total={totalComments}
                hasPrevious={page > 1}
                hasNext={page < totalPages}
                onPrevious={() => setPage((current) => Math.max(1, current - 1))}
                onNext={() => setPage((current) => Math.min(totalPages, current + 1))}
              />
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
