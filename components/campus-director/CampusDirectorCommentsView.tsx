"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import AcademicYearSelect from "@/components/secretary/AcademicYearSelect";
import PaginationControls from "@/components/secretary/PaginationControls";
import SummaryCommentsInstructorTable, {
  SummaryCommentsInstructorRow,
} from "@/components/secretary/SummaryCommentsInstructorTable";
import SummaryCommentsTable, {
  SummaryComment,
} from "@/components/secretary/SummaryCommentsTable";
import AppSelect from "@/components/ui/AppSelect";
import InlineLoadingIndicator from "@/components/ui/InlineLoadingIndicator";
import PortalPageLoader from "@/components/ui/PortalPageLoader";
import { getApiErrorMessage, readApiResponse } from "@/lib/client-api";
import {
  getCampusDirectorRoleFilterLabel,
  getCampusDirectorRoleOptions,
  type CampusDirectorRoleFilter,
} from "@/lib/reporting-roles";

type TargetOption = {
  id: number;
  label: string;
  sublabel?: string;
};

type CampusDirectorCommentsResponse = {
  academicYear: string;
  years: string[];
  semesters: string[];
  semester: string;
  role: CampusDirectorRoleFilter;
  selectedTarget: {
    id: number;
    name: string;
    label: string;
  } | null;
  targets: SummaryCommentsInstructorRow[];
  targetTotal: number;
  comments: SummaryComment[];
  total: number;
  targetCount: number;
};

const targetListPageSize = 10;
const detailPageSizeOptions = ["10", "20"] as const;
const roleOptions = getCampusDirectorRoleOptions();

export default function CampusDirectorCommentsView() {
  const [targetSearchInput, setTargetSearchInput] = useState("");
  const [targetSearchTerm, setTargetSearchTerm] = useState("");
  const [commentSearchInput, setCommentSearchInput] = useState("");
  const [commentSearchTerm, setCommentSearchTerm] = useState("");
  const [selectedTargetId, setSelectedTargetId] = useState<number | null>(null);
  const [targetOptions, setTargetOptions] = useState<TargetOption[]>([]);
  const [role, setRole] = useState<CampusDirectorRoleFilter>("all");
  const [academicYear, setAcademicYear] = useState("");
  const [academicYearOptions, setAcademicYearOptions] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [detailPageSize, setDetailPageSize] = useState("10");
  const [targets, setTargets] = useState<SummaryCommentsInstructorRow[]>([]);
  const [comments, setComments] = useState<SummaryComment[]>([]);
  const [selectedTarget, setSelectedTarget] =
    useState<CampusDirectorCommentsResponse["selectedTarget"]>(null);
  const [targetTotal, setTargetTotal] = useState(0);
  const [totalComments, setTotalComments] = useState(0);
  const [targetCount, setTargetCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const hasLoadedOnceRef = useRef(false);
  const showingTargetDetail = selectedTargetId !== null;
  const activePageSize = showingTargetDetail
    ? Number.parseInt(detailPageSize, 10)
    : targetListPageSize;

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
          data.map((target) => ({
            id: target.id,
            label: target.name || target.email,
            sublabel: [target.roleLabel, target.department || target.email].filter(Boolean).join(" | "),
          }))
        );
      } catch (err) {
        console.error(err);
        setTargetOptions([]);
      }
    };

    setTargetSearchInput("");
    setTargetSearchTerm("");
    setCommentSearchInput("");
    setCommentSearchTerm("");
    setSelectedTargetId(null);
    setShowSuggestions(false);
    setPage(1);
    void fetchTargetOptions();
  }, [role]);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(activePageSize),
          semester: "all",
          role,
        });

        if (targetSearchTerm) {
          params.set("search", targetSearchTerm);
        }

        if (selectedTargetId) {
          params.set("targetId", String(selectedTargetId));
        }

        if (commentSearchTerm) {
          params.set("commentSearch", commentSearchTerm);
        }

        if (academicYear) {
          params.set("academicYear", academicYear);
        }

        const res = await fetch(`/api/campus-director/comments?${params.toString()}`, {
          cache: "no-store",
        });
        const data = await readApiResponse<CampusDirectorCommentsResponse>(res);

        setAcademicYear(data.academicYear);
        setAcademicYearOptions(data.years.length > 0 ? data.years : [data.academicYear]);
        setSelectedTarget(data.selectedTarget);
        setTargets(data.targets || []);
        setTargetTotal(data.targetTotal || 0);
        setComments(data.comments || []);
        setTotalComments(data.total || 0);
        setTargetCount(data.targetCount || 0);

        if (selectedTargetId && !data.selectedTarget) {
          setSelectedTargetId(null);
        }

        hasLoadedOnceRef.current = true;
      } catch (err) {
        setError(getApiErrorMessage(err, "Failed to load campus director comments"));
      } finally {
        setLoading(false);
      }
    };

    void fetchComments();
  }, [academicYear, activePageSize, commentSearchTerm, page, role, selectedTargetId, targetSearchTerm]);

  const filteredSuggestions = useMemo(() => {
    const normalized = targetSearchInput.trim().toLowerCase();

    if (!normalized) {
      return targetOptions.slice(0, 8);
    }

    return targetOptions
      .filter((suggestion) =>
        `${suggestion.label} ${suggestion.sublabel || ""}`.toLowerCase().includes(normalized)
      )
      .slice(0, 8);
  }, [targetOptions, targetSearchInput]);

  const visibleTotal = showingTargetDetail ? totalComments : targetTotal;
  const startIndex = (page - 1) * activePageSize;
  const startDisplay = visibleTotal === 0 ? 0 : startIndex + 1;
  const endDisplay = Math.min(startIndex + activePageSize, visibleTotal);
  const totalPages = Math.max(1, Math.ceil(visibleTotal / activePageSize));

  const handleSearch = () => {
    setPage(1);
    setTargetSearchTerm(targetSearchInput.trim());
    setSelectedTargetId(null);
    setShowSuggestions(false);
  };

  const handleSuggestionSelect = (suggestion: TargetOption) => {
    setTargetSearchInput(suggestion.label);
    setTargetSearchTerm(suggestion.label);
    setSelectedTargetId(suggestion.id);
    setPage(1);
    setShowSuggestions(false);
  };

  const handleCommentSearch = () => {
    setPage(1);
    setCommentSearchTerm(commentSearchInput.trim());
  };

  const handleBackToTargetList = () => {
    setSelectedTargetId(null);
    setSelectedTarget(null);
    setCommentSearchInput("");
    setCommentSearchTerm("");
    setPage(1);
  };

  if (loading && !hasLoadedOnceRef.current) {
    return (
      <PortalPageLoader
        title="View Summary Comments"
        description="Loading campus-wide comment filters, grouped results, and evaluated roles..."
        cards={1}
        compact
      />
    );
  }

  return (
    <main className="app-page-with-topbar">
      <div className="app-page-card max-w-[1600px]">
        <div className="pb-5">
          <h1 className="text-[28px] font-extrabold leading-tight text-[#24135f]">
            View Summary Comments
          </h1>
          <p className="mt-1 text-[13px] text-[#6c6684]">
            Search comments by role, academic year, and evaluated user.
          </p>
        </div>

        {error ? (
          <div className="app-alert-danger">{error}</div>
        ) : (
          <section className="rounded-[24px] border border-[#dddddd] bg-white p-4 shadow-[0_14px_34px_rgba(36,19,95,0.06)] sm:p-6">
            <div className="rounded-[18px] border border-[#ece7f6] bg-[#faf8ff] px-5 py-4 text-[14px] text-[#6c6684]">
              {showingTargetDetail
                ? `Showing anonymous comments for ${
                    selectedTarget?.name || "the selected user"
                  } in ${academicYear || "the selected academic year"} across all semesters.`
                : `Showing grouped comments for ${
                    academicYear || "the selected academic year"
                  } across ${targetCount} matched user${targetCount === 1 ? "" : "s"}.`}
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)_220px]">
              <div>
                <AppSelect
                  value={role}
                  onChange={(nextValue) => setRole(nextValue as CampusDirectorRoleFilter)}
                  options={roleOptions}
                  triggerClassName="min-h-[44px] rounded-[16px] text-[13px]"
                />
              </div>

              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
                {showingTargetDetail ? (
                  <button
                    type="button"
                    onClick={handleBackToTargetList}
                    className="rounded-full border border-[#d8d2e6] bg-white px-4 py-2 text-[13px] font-semibold text-[#24135f] transition hover:bg-[#f7f4ff]"
                  >
                    Back to User List
                  </button>
                ) : (
                  <>
                    <div className="relative w-full">
                      <Search
                        size={16}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8e89aa]"
                      />
                      <input
                        type="text"
                        value={targetSearchInput}
                        placeholder={`Search ${getCampusDirectorRoleFilterLabel(role)}`}
                        onChange={(event) => {
                          setTargetSearchInput(event.target.value);
                          setSelectedTargetId(null);

                          if (!event.target.value.trim()) {
                            setPage(1);
                            setTargetSearchTerm("");
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
                  </>
                )}
              </div>

              <div className="w-full">
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

            {targetSearchTerm && !showingTargetDetail && targets.length === 0 ? (
              <p className="mt-4 text-[13px] text-[#6c6684]">
                No {getCampusDirectorRoleFilterLabel(role).toLowerCase()} matched your search.
              </p>
            ) : null}

            {showingTargetDetail ? (
              <>
                <div className="mt-4 rounded-[18px] border border-[#ece7f6] bg-white px-4 py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[18px] font-bold text-[#24135f]">
                      {selectedTarget?.name || "Evaluated User"}
                    </p>
                      <p className="mt-1 text-[13px] text-[#6c6684]">
                        {selectedTarget?.label || getCampusDirectorRoleFilterLabel(role)} | {academicYear || "-"} | All Semesters
                      </p>
                      <p className="mt-2 text-[13px] font-semibold text-[#24135f]">
                        {totalComments} comment{totalComments === 1 ? "" : "s"} found
                      </p>
                    </div>

                    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
                      <div className="relative w-full sm:w-[250px]">
                        <Search
                          size={16}
                          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8e89aa]"
                        />
                        <input
                          type="text"
                          value={commentSearchInput}
                          placeholder="Search within comments"
                          onChange={(event) => setCommentSearchInput(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              handleCommentSearch();
                            }
                          }}
                          className="app-input h-[44px] rounded-[16px] pl-9 text-[13px]"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleCommentSearch}
                        className="app-btn-secondary px-4 py-2 text-[13px]"
                      >
                        Search Comments
                      </button>

                      <div className="sm:w-[150px]">
                        <AppSelect
                          value={detailPageSize}
                          onChange={(value) => {
                            setDetailPageSize(value);
                            setPage(1);
                          }}
                          options={detailPageSizeOptions.map((value) => ({
                            value,
                            label: `${value} per page`,
                          }))}
                          triggerClassName="min-h-[44px] rounded-[16px] text-[13px]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-[18px]">
                  <div className="flex items-center justify-between border-b border-[#ece7f6] px-4 py-3">
                    <h3 className="text-[16px] font-bold text-[#24135f]">Comments list</h3>
                    {loading && hasLoadedOnceRef.current ? (
                      <InlineLoadingIndicator label="Refreshing comments..." />
                    ) : null}
                  </div>
                  <SummaryCommentsTable comments={comments} startIndex={startDisplay} />
                </div>
              </>
            ) : (
              <div className="mt-4 rounded-[18px]">
                <div className="flex items-center justify-between border-b border-[#ece7f6] px-4 py-3">
                  <h3 className="text-[16px] font-bold text-[#24135f]">Evaluated users</h3>
                  {loading && hasLoadedOnceRef.current ? (
                    <InlineLoadingIndicator label="Refreshing comments..." />
                  ) : null}
                </div>
                <SummaryCommentsInstructorTable
                  instructors={targets}
                  onSelectInstructor={(targetId) => {
                    setSelectedTargetId(targetId);
                    setPage(1);
                    setCommentSearchInput("");
                    setCommentSearchTerm("");
                    setShowSuggestions(false);
                  }}
                  emptyMessage="No comments found for the selected filters."
                  entityLabel={
                    role === "all" ? "Evaluated User" : getCampusDirectorRoleFilterLabel(role)
                  }
                />
              </div>
            )}

            <PaginationControls
              start={startDisplay}
              end={endDisplay}
              total={visibleTotal}
              hasPrevious={page > 1}
              hasNext={page < totalPages}
              onPrevious={() => setPage((current) => Math.max(1, current - 1))}
              onNext={() => setPage((current) => Math.min(totalPages, current + 1))}
            />
          </section>
        )}
      </div>
    </main>
  );
}
