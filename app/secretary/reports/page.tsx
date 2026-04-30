"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText, MessageSquareText, Search, Star } from "lucide-react";
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
import { readApiResponse } from "@/lib/client-api";
import {
  getCampusDirectorRoleFilterPluralLabel,
  getCampusDirectorRoleOptions,
  getReportableRoleLabel,
  type CampusDirectorRoleFilter,
} from "@/lib/reporting-roles";

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

type ReportsResponse = {
  results: Result[];
  years: string[];
  semesters: string[];
  role: CampusDirectorRoleFilter;
  completedCount: number;
  totalCount: number;
};

type SummaryCommentsResponse = {
  academicYear: string;
  semester: string;
  years: string[];
  semesters: string[];
  selectedInstructor: SummaryCommentsInstructorRow | null;
  instructors: SummaryCommentsInstructorRow[];
  instructorTotal: number;
  comments: SummaryComment[];
  total: number;
  instructorCount: number;
};

const instructorListPageSize = 10;
const detailPageSizeOptions = ["10", "20"] as const;
const roleOptions = getCampusDirectorRoleOptions();

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<"results" | "comments">("results");

  const [results, setResults] = useState<Result[]>([]);
  const [resultsLoading, setResultsLoading] = useState(true);
  const [reportCompletedCount, setReportCompletedCount] = useState(0);
  const [reportTotalCount, setReportTotalCount] = useState(0);
  const [years, setYears] = useState<string[]>([]);
  const [semesters, setSemesters] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [semester, setSemester] = useState("");
  const [role, setRole] = useState<CampusDirectorRoleFilter>("all");

  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [commentSearchInput, setCommentSearchInput] = useState("");
  const [commentSearchTerm, setCommentSearchTerm] = useState("");
  const [academicYearOptions, setAcademicYearOptions] = useState<string[]>([]);
  const [commentSemesterOptions, setCommentSemesterOptions] = useState<string[]>([]);
  const [commentAcademicYear, setCommentAcademicYear] = useState("");
  const [commentSemester, setCommentSemester] = useState("");
  const [selectedInstructorId, setSelectedInstructorId] = useState<number | null>(null);
  const [instructorPage, setInstructorPage] = useState(1);
  const [detailPage, setDetailPage] = useState(1);
  const [detailPageSize, setDetailPageSize] = useState<string>("10");
  const [instructors, setInstructors] = useState<SummaryCommentsInstructorRow[]>([]);
  const [comments, setComments] = useState<SummaryComment[]>([]);
  const [selectedInstructor, setSelectedInstructor] = useState<SummaryCommentsInstructorRow | null>(null);
  const [instructorTotal, setInstructorTotal] = useState(0);
  const [total, setTotal] = useState(0);
  const [instructorCount, setInstructorCount] = useState(0);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const showingInstructorDetail = selectedInstructorId !== null;
  const activePage = showingInstructorDetail ? detailPage : instructorPage;
  const activePageSize = showingInstructorDetail
    ? Number.parseInt(detailPageSize, 10)
    : instructorListPageSize;
  const startIndex = (activePage - 1) * activePageSize;
  const visibleTotal = showingInstructorDetail ? total : instructorTotal;
  const startDisplay = visibleTotal === 0 ? 0 : startIndex + 1;
  const endDisplay = Math.min(startIndex + activePageSize, visibleTotal);
  const totalPages = Math.max(1, Math.ceil(visibleTotal / activePageSize));

  useEffect(() => {
    setActiveTab(searchParams.get("tab") === "comments" ? "comments" : "results");
  }, [searchParams]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      if (session?.user?.role !== "secretary" && session?.user?.role !== "admin") {
        router.push("/unauthorized");
      }
    }
  }, [router, session, status]);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    const fetchResults = async () => {
      try {
        setResultsLoading(true);

        const params = new URLSearchParams();
        if (academicYear) {
          params.append("academicYear", academicYear);
        }
        if (semester) {
          params.append("semester", semester);
        }
        if (role) {
          params.append("role", role);
        }

        const res = await fetch(`/api/reports?${params.toString()}`, {
          cache: "no-store",
        });

        const data = await readApiResponse<ReportsResponse>(res);
        setResults(data.results || []);
        setReportCompletedCount(data.completedCount || 0);
        setReportTotalCount(data.totalCount || 0);
        setYears(data.years || []);
        setSemesters(data.semesters || []);
        setRole(data.role || "all");
      } catch (error) {
        console.error("Failed to fetch reports:", error);
        setResults([]);
        setReportCompletedCount(0);
        setReportTotalCount(0);
        setYears([]);
        setSemesters([]);
      } finally {
        setResultsLoading(false);
      }
    };

    void fetchResults();
  }, [academicYear, role, semester, status]);

  useEffect(() => {
    if (status !== "authenticated" || activeTab !== "comments") {
      return;
    }

    const controller = new AbortController();
    let isCurrentRequest = true;

    const fetchComments = async () => {
      try {
        setCommentsLoading(true);

        const params = new URLSearchParams({
          page: String(activePage),
          pageSize: String(activePageSize),
        });

        if (searchTerm) {
          params.set("search", searchTerm);
        }
        if (commentSearchTerm) {
          params.set("commentSearch", commentSearchTerm);
        }
        if (selectedInstructorId) {
          params.set("instructorId", String(selectedInstructorId));
        }

        if (commentAcademicYear) {
          params.set("academicYear", commentAcademicYear);
        }
        if (commentSemester) {
          params.set("semester", commentSemester);
        }

        const res = await fetch(`/api/summary-comments?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = await readApiResponse<SummaryCommentsResponse>(res);

        if (!isCurrentRequest) {
          return;
        }

        setAcademicYearOptions(data.years || []);
        setCommentSemesterOptions(data.semesters || []);
        setSelectedInstructor(data.selectedInstructor);
        setInstructors(data.instructors || []);
        setInstructorTotal(data.instructorTotal || 0);
        setComments(data.comments || []);
        setTotal(data.total || 0);
        setInstructorCount(data.instructorCount || 0);

        if (selectedInstructorId && !data.selectedInstructor) {
          setSelectedInstructorId(null);
        }

        if (data.academicYear && data.academicYear !== commentAcademicYear) {
          setCommentAcademicYear(data.academicYear);
        }
        if ((data.semester || "") !== commentSemester) {
          setCommentSemester(data.semester || "");
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        if (!isCurrentRequest) {
          return;
        }

        console.error("Failed to load summary comments:", error);
        setSelectedInstructor(null);
        setInstructors([]);
        setInstructorTotal(0);
        setComments([]);
        setTotal(0);
        setInstructorCount(0);
      } finally {
        if (isCurrentRequest) {
          setCommentsLoading(false);
        }
      }
    };

    void fetchComments();
    return () => {
      isCurrentRequest = false;
      controller.abort();
    };
  }, [
    activePage,
    activePageSize,
    activeTab,
    commentAcademicYear,
    commentSearchTerm,
    commentSemester,
    searchTerm,
    selectedInstructorId,
    status,
  ]);

  const filteredResults = useMemo(() => {
    return results.filter((item) =>
      (item.user?.name || item.user?.email || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [results, search]);

  const averageRating = useMemo(() => {
    if (filteredResults.length === 0) {
      return 0;
    }

    const totalRating = filteredResults.reduce((sum, item) => sum + item.averageRating, 0);
    return totalRating / filteredResults.length;
  }, [filteredResults]);

  const completedCount = reportCompletedCount;
  const totalCount = reportTotalCount;
  const completionRate = totalCount > 0
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
            className={star <= fullStars ? "fill-[#f4c542] text-[#f4c542]" : "text-[#f4c542]"}
          />
        ))}
      </div>
    );
  };

  const handleTabChange = (nextTab: "results" | "comments") => {
    setActiveTab(nextTab);
    router.replace(
      nextTab === "comments" ? "/secretary/reports?tab=comments" : "/secretary/reports",
      { scroll: false }
    );
  };

  const handleCommentAcademicYearChange = (value: string) => {
    setCommentAcademicYear(value);
    setInstructorPage(1);
    setDetailPage(1);
  };

  const handleCommentSemesterChange = (value: string) => {
    setCommentSemester(value);
    setInstructorPage(1);
    setDetailPage(1);
  };

  const handleCommentSearch = () => {
    setInstructorPage(1);
    setSearchTerm(searchInput.trim());
  };

  const handleInstructorSelect = (instructorId: number) => {
    setSelectedInstructorId(instructorId);
    setDetailPage(1);
    setCommentSearchInput("");
    setCommentSearchTerm("");
  };

  const handleCommentDetailSearch = () => {
    setDetailPage(1);
    setCommentSearchTerm(commentSearchInput.trim());
  };

  const handleBackToInstructorList = () => {
    setSelectedInstructorId(null);
    setSelectedInstructor(null);
    setCommentSearchInput("");
    setCommentSearchTerm("");
    setDetailPage(1);
  };

  if (activeTab === "results" && resultsLoading) {
    return (
        <PortalPageLoader
          title="Results"
          description="Loading evaluation results and summary metrics..."
        cards={1}
        compact
      />
    );
  }

  if (
    activeTab === "comments" &&
    commentsLoading &&
    !searchTerm &&
    instructors.length === 0 &&
    comments.length === 0
  ) {
    return (
      <PortalPageLoader
        title="Results"
        description="Loading summary comments and instructor search..."
        cards={1}
        compact
      />
    );
  }

  return (
    <main className="app-page-with-topbar">
      <div className="app-page-card max-w-[1600px]">
        <div className="border-b border-[#ece7f6] pb-5">
          <div className="flex items-start gap-4">
            <div className="mt-1 h-[52px] w-[8px] bg-[#24135f]" />
            <div>
              <h1 className="text-[26px] font-extrabold leading-none text-[#24135f] md:text-[30px]">
                Results
              </h1>
              <p className="mt-1 text-[15px] text-[#4b4b68]">
                Review evaluation ratings and summary comments from one place.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => handleTabChange("results")}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[14px] font-bold transition ${
              activeTab === "results"
                ? "border-[#24135f] bg-[#24135f] text-white"
                : "border-[#ddd6ee] bg-white text-[#24135f] hover:bg-[#f7f4ff]"
            }`}
          >
            <FileText size={16} />
            Evaluation Results
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("comments")}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[14px] font-bold transition ${
              activeTab === "comments"
                ? "border-[#24135f] bg-[#24135f] text-white"
                : "border-[#ddd6ee] bg-white text-[#24135f] hover:bg-[#f7f4ff]"
            }`}
          >
            <MessageSquareText size={16} />
            Summary Comments
          </button>
        </div>

        {activeTab === "results" ? (
          <>
            <div className="mt-8 grid grid-cols-1 gap-4 md:mt-10 md:grid-cols-2 md:gap-6">
              <div className="app-stat-card text-center">
                <h2 className="text-[22px] font-extrabold text-[#24135f]">Average Rating</h2>
                <div className="mt-1 text-[58px] font-extrabold leading-none text-[#24135f]">
                  {averageRating.toFixed(2)}
                </div>
                <div className="mt-2 flex justify-center">{renderStars(averageRating)}</div>
                <p className="mt-2 text-[14px] text-[#403a68]">
                  Across all {getCampusDirectorRoleFilterPluralLabel(role)}
                </p>
              </div>

              <div className="app-stat-card text-center">
                <h2 className="text-[22px] font-extrabold text-[#24135f]">Completion Rate</h2>
                <div className="mt-1 text-[58px] font-extrabold leading-none text-[#24135f]">
                  {completionRate}%
                </div>
                <p className="mt-4 text-[14px] text-[#403a68]">
                  {completedCount}/{totalCount} Completed
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex w-full flex-col gap-3 md:max-w-[620px] md:flex-row md:items-center">
                <div className="w-full md:max-w-[220px]">
                  <AppSelect
                    value={role}
                    onChange={(value) => setRole(value as CampusDirectorRoleFilter)}
                    options={roleOptions}
                    triggerClassName="min-h-[46px] rounded-[16px] text-[15px]"
                  />
                </div>
                <div className="relative w-full">
                  <Search
                    size={18}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8e89aa]"
                  />
                  <input
                    type="text"
                    placeholder="Search All Roles"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="app-input h-[46px] rounded-[16px] pl-10 text-[15px]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
                <label className="text-[15px] font-bold text-black">Select Academic Year:</label>

                <div className="w-full min-w-0 md:min-w-[165px]">
                  <AppSelect
                    value={academicYear}
                    onChange={setAcademicYear}
                    options={[
                      { value: "", label: "All Years" },
                      ...years.map((year) => ({ value: year, label: year })),
                    ]}
                    triggerClassName="min-h-[46px] rounded-[16px] text-[15px]"
                  />
                </div>

                <div className="w-full min-w-0 md:min-w-[165px]">
                  <AppSelect
                    value={semester}
                    onChange={setSemester}
                    options={[
                      { value: "", label: "All Semesters" },
                      ...semesters.map((item) => ({ value: item, label: item })),
                    ]}
                    triggerClassName="min-h-[46px] rounded-[16px] text-[15px]"
                  />
                </div>
              </div>
            </div>

            <div className="app-table-shell mt-4 hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[620px] text-left">
                <thead className="app-table-head">
                  <tr>
                    <th>Evaluatee</th>
                    <th>Role</th>
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
                        <td className="app-table-cell text-[15px] text-[#2f2a57]">
                          {getReportableRoleLabel(item.user?.role || "")}
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
                      <td colSpan={3} className="px-5 py-8 text-center text-[#7d7d95]">
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
                    <p className="mt-1 text-[13px] text-[#6c6684]">
                      {getReportableRoleLabel(item.user?.role || "")}
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
          </>
        ) : (
          <div className="mt-6 space-y-5 rounded-[24px] border border-[#e3e3e3] bg-white p-5 shadow-[0_14px_34px_rgba(36,19,95,0.06)]">
            <div className="rounded-[18px] border border-[#ece7f6] bg-[#faf8ff] px-5 py-4 text-[14px] text-[#6c6684]">
              {showingInstructorDetail
                ? `Showing anonymous comments for ${
                    selectedInstructor?.instructor_name || "the selected instructor"
                  } in ${commentAcademicYear || "the selected academic year"}${
                    commentSemester ? ` | ${commentSemester}` : ""
                  }.`
                : searchTerm
                ? `Showing instructor groups matching "${searchTerm}" in ${
                    commentAcademicYear || "the selected academic year"
                  }${commentSemester ? ` | ${commentSemester}` : ""}.`
                : `Showing all instructor groups with comments for ${
                    commentAcademicYear || "the selected academic year"
                  }${commentSemester ? ` | ${commentSemester}` : ""}.`}
              {!showingInstructorDetail && visibleTotal > 0
                ? ` ${instructorCount} instructor${instructorCount === 1 ? "" : "s"} matched.`
                : ""}
            </div>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex w-full flex-col gap-3 md:flex-row md:items-center">
                {showingInstructorDetail ? (
                  <button
                    type="button"
                    onClick={handleBackToInstructorList}
                    className="min-h-[44px] rounded-full border border-[#d8d2e6] bg-white px-5 py-2 text-[14px] font-semibold text-[#24135f] transition hover:bg-[#f7f4ff]"
                  >
                    Back to Instructor List
                  </button>
                ) : (
                  <>
                    <div className="relative w-full md:max-w-[320px]">
                      <Search
                        size={16}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8e89aa]"
                      />
                      <input
                        type="text"
                        placeholder="Search Instructor"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleCommentSearch();
                          }
                        }}
                        className="app-input h-[44px] rounded-[16px] pl-10 text-[14px]"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleCommentSearch}
                      className="app-btn-primary min-h-[44px] px-5 py-2 text-[14px]"
                    >
                      Search
                    </button>
                  </>
                )}
              </div>

              <div className="flex justify-start lg:justify-end">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <AcademicYearSelect
                    value={commentAcademicYear}
                    options={academicYearOptions.length > 0 ? academicYearOptions : ["No Years"]}
                    onChange={handleCommentAcademicYearChange}
                  />
                  <div className="w-full min-w-0 sm:min-w-[170px]">
                    <AppSelect
                      value={commentSemester}
                      onChange={handleCommentSemesterChange}
                      options={[
                        { value: "", label: "All Semesters" },
                        ...commentSemesterOptions.map((item) => ({ value: item, label: item })),
                      ]}
                      triggerClassName="min-h-[46px] rounded-[16px] text-[14px] sm:min-h-[44px]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {showingInstructorDetail ? (
              <>
                <div className="rounded-[18px] border border-[#ece7f6] bg-white px-5 py-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-[20px] font-extrabold text-[#24135f]">
                        {selectedInstructor?.instructor_name || "Instructor"}
                      </p>
                      <p className="mt-1 text-[13px] text-[#6c6684]">
                        {commentAcademicYear || "-"} | {commentSemester || "All Semesters"}
                      </p>
                      <p className="mt-2 text-[13px] font-semibold text-[#24135f]">
                        {total} comment{total === 1 ? "" : "s"} found
                      </p>
                    </div>

                    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto">
                      <div className="relative w-full sm:w-[300px]">
                        <Search
                          size={16}
                          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8e89aa]"
                        />
                        <input
                          type="text"
                          placeholder="Search within comments"
                          value={commentSearchInput}
                          onChange={(e) => setCommentSearchInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleCommentDetailSearch();
                            }
                          }}
                          className="app-input h-[44px] rounded-[16px] pl-10 text-[14px]"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleCommentDetailSearch}
                        className="app-btn-primary min-h-[44px] px-5 py-2 text-[14px]"
                      >
                        Search Comments
                      </button>

                      <div className="w-full sm:w-[150px]">
                        <AppSelect
                          value={detailPageSize}
                          onChange={(value) => {
                            setDetailPageSize(value);
                            setDetailPage(1);
                          }}
                          options={detailPageSizeOptions.map((value) => ({
                            value,
                            label: `${value} per page`,
                          }))}
                          triggerClassName="min-h-[44px] rounded-[16px] text-[14px]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[18px]">
                  <SummaryCommentsTable
                    comments={comments}
                    startIndex={startDisplay}
                    emptyMessage="No comments found for the selected filters."
                  />
                </div>
              </>
            ) : (
              <div className="rounded-[18px]">
                <SummaryCommentsInstructorTable
                  instructors={instructors}
                  onSelectInstructor={handleInstructorSelect}
                  emptyMessage="No comments found for the selected filters."
                />
              </div>
            )}

            {commentsLoading ? <InlineLoadingIndicator label="Refreshing comments..." /> : null}

            <PaginationControls
              start={startDisplay}
              end={endDisplay}
              total={visibleTotal}
              hasPrevious={activePage > 1}
              hasNext={activePage < totalPages}
              onPrevious={() => {
                if (showingInstructorDetail) {
                  setDetailPage((current) => Math.max(1, current - 1));
                  return;
                }

                setInstructorPage((current) => Math.max(1, current - 1));
              }}
              onNext={() => {
                if (showingInstructorDetail) {
                  setDetailPage((current) => Math.min(totalPages, current + 1));
                  return;
                }

                setInstructorPage((current) => Math.min(totalPages, current + 1));
              }}
            />
          </div>
        )}
      </div>
    </main>
  );
}
