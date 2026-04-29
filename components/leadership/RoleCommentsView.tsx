"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Search } from "lucide-react";
import RoleCommentsPanel from "@/components/comments/RoleCommentsPanel";
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

type CommentItem = {
  id: number;
  comment: string;
  academicYear: string;
  evaluatorName: string;
  evaluatorRole: string;
};

type LeadershipCommentsResponse = {
  academicYear: string;
  years: string[];
  semesters: string[];
  semester: string;
  mySummaryComments: CommentItem[];
  targetComments: {
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
};

type RoleCommentsViewProps = {
  apiEndpoint: string;
  viewerRoleLabel: string;
  targetLabel: string;
  targetPluralLabel: string;
};

const myCommentsPageSize = 5;
const targetListPageSize = 10;
const detailPageSizeOptions = ["10", "20"] as const;

export default function RoleCommentsView({
  apiEndpoint,
  viewerRoleLabel,
  targetLabel,
  targetPluralLabel,
}: RoleCommentsViewProps) {
  const { data: session } = useSession();
  const [targetSearchInput, setTargetSearchInput] = useState("");
  const [targetSearchTerm, setTargetSearchTerm] = useState("");
  const [commentSearchInput, setCommentSearchInput] = useState("");
  const [commentSearchTerm, setCommentSearchTerm] = useState("");
  const [selectedTargetId, setSelectedTargetId] = useState<number | null>(null);
  const [academicYear, setAcademicYear] = useState("");
  const [academicYearOptions, setAcademicYearOptions] = useState<string[]>([]);
  const [semester, setSemester] = useState("all");
  const [semesterOptions, setSemesterOptions] = useState<string[]>(["All Semesters"]);
  const [myPage, setMyPage] = useState(1);
  const [targetPage, setTargetPage] = useState(1);
  const [targetDetailPageSize, setTargetDetailPageSize] = useState("10");
  const [mySummaryComments, setMySummaryComments] = useState<CommentItem[]>([]);
  const [targets, setTargets] = useState<SummaryCommentsInstructorRow[]>([]);
  const [targetComments, setTargetComments] = useState<SummaryComment[]>([]);
  const [selectedTarget, setSelectedTarget] =
    useState<LeadershipCommentsResponse["targetComments"]["selectedTarget"]>(null);
  const [targetTotal, setTargetTotal] = useState(0);
  const [totalTargetComments, setTotalTargetComments] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [targetLoading, setTargetLoading] = useState(false);
  const [error, setError] = useState("");
  const hasLoadedOnceRef = useRef(false);
  const showingTargetDetail = selectedTargetId !== null;
  const activeTargetPage = targetPage;
  const activeTargetPageSize = showingTargetDetail
    ? Number.parseInt(targetDetailPageSize, 10)
    : targetListPageSize;

  useEffect(() => {
    const fetchComments = async () => {
      try {
        if (!hasLoadedOnceRef.current) {
          setInitialLoading(true);
        } else {
          setTargetLoading(true);
        }
        setError("");

        const params = new URLSearchParams({
          page: String(activeTargetPage),
          pageSize: String(activeTargetPageSize),
          semester,
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

        const res = await fetch(`${apiEndpoint}?${params.toString()}`, {
          cache: "no-store",
        });
        const data = await readApiResponse<LeadershipCommentsResponse>(res);

        setAcademicYear(data.academicYear);
        setAcademicYearOptions(data.years.length > 0 ? data.years : [data.academicYear]);
        setSemester(data.semester);
        setSemesterOptions(data.semesters.length > 0 ? data.semesters : ["All Semesters"]);
        setMySummaryComments(data.mySummaryComments || []);
        setSelectedTarget(data.targetComments.selectedTarget);
        setTargets(data.targetComments.targets || []);
        setTargetTotal(data.targetComments.targetTotal || 0);
        setTargetComments(data.targetComments.comments || []);
        setTotalTargetComments(data.targetComments.total || 0);
        if (selectedTargetId && !data.targetComments.selectedTarget) {
          setSelectedTargetId(null);
        }
        hasLoadedOnceRef.current = true;
      } catch (err) {
        setError(getApiErrorMessage(err, `Failed to load ${targetLabel.toLowerCase()} comments`));
      } finally {
        setInitialLoading(false);
        setTargetLoading(false);
      }
    };

    fetchComments();
  }, [
    academicYear,
    activeTargetPage,
    activeTargetPageSize,
    apiEndpoint,
    commentSearchTerm,
    selectedTargetId,
    semester,
    targetLabel,
    targetSearchTerm,
  ]);

  const myCommentsTableData = useMemo<SummaryComment[]>(() => {
    return mySummaryComments.map((comment) => ({
      id: comment.id,
      comment: comment.comment,
    }));
  }, [mySummaryComments]);

  const myStartIndex = (myPage - 1) * myCommentsPageSize;
  const myVisibleComments = myCommentsTableData.slice(myStartIndex, myStartIndex + myCommentsPageSize);
  const myTotal = myCommentsTableData.length;
  const myStartDisplay = myTotal === 0 ? 0 : myStartIndex + 1;
  const myEndDisplay = Math.min(myStartIndex + myCommentsPageSize, myTotal);
  const myTotalPages = Math.max(1, Math.ceil(myTotal / myCommentsPageSize));

  const targetVisibleTotal = showingTargetDetail ? totalTargetComments : targetTotal;
  const targetStartIndex = (activeTargetPage - 1) * activeTargetPageSize;
  const targetStartDisplay = targetVisibleTotal === 0 ? 0 : targetStartIndex + 1;
  const targetEndDisplay = Math.min(targetStartIndex + activeTargetPageSize, targetVisibleTotal);
  const targetTotalPages = Math.max(1, Math.ceil(targetVisibleTotal / activeTargetPageSize));

  const handleTargetSearch = () => {
    setTargetPage(1);
    setTargetSearchTerm(targetSearchInput.trim());
  };

  const handleTargetSelect = (targetId: number) => {
    setSelectedTargetId(targetId);
    setTargetPage(1);
    setCommentSearchInput("");
    setCommentSearchTerm("");
  };

  const handleAcademicYearChange = (value: string) => {
    setAcademicYear(value);
    setMyPage(1);
    setTargetPage(1);
  };

  const handleCommentSearch = () => {
    setTargetPage(1);
    setCommentSearchTerm(commentSearchInput.trim());
  };

  const handleBackToTargetList = () => {
    setSelectedTargetId(null);
    setSelectedTarget(null);
    setCommentSearchInput("");
    setCommentSearchTerm("");
    setTargetPage(1);
  };

  if (initialLoading) {
    return (
      <PortalPageLoader
        title="View Comments"
        description="Loading summary comments, academic years, and searchable evaluator data..."
        cards={2}
      />
    );
  }

  return (
    <main className="app-page-with-topbar">
      <div className="app-page-card max-w-[1600px]">
        <div className="pb-5">
          <h1 className="text-[28px] font-extrabold leading-tight text-[#24135f]">
            View Comments
          </h1>
        </div>

        {error ? (
          <div className="app-alert-danger">
            {error}
          </div>
        ) : (
          <div className="rounded-[24px] border border-[#dddddd] bg-white p-4 shadow-[0_14px_34px_rgba(36,19,95,0.06)] sm:p-6">
            <div className="mb-4 flex justify-end">
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
                <label className="text-[14px] font-semibold text-[#24135f]">Semester</label>
                <div className="sm:w-[200px]">
                  <AppSelect
                  value={semester}
                  onChange={(nextValue) => {
                    setSemester(nextValue);
                    setTargetPage(1);
                  }}
                  options={semesterOptions.map((option) => ({
                    value: option.toLowerCase() === "all semesters" ? "all" : option,
                    label: option,
                  }))}
                  triggerClassName="min-h-[44px] rounded-[16px] text-[13px]"
                />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
              <RoleCommentsPanel
                title="View My Summary Comments"
                profileName={session?.user?.name || viewerRoleLabel}
                profileRole={viewerRoleLabel}
                academicYear={academicYear}
                years={academicYearOptions}
                comments={myVisibleComments}
                start={myStartDisplay}
                end={myEndDisplay}
                total={myTotal}
                hasPrevious={myPage > 1}
                hasNext={myPage < myTotalPages}
                onYearChange={handleAcademicYearChange}
                onPrevious={() => setMyPage((current) => Math.max(1, current - 1))}
                onNext={() => setMyPage((current) => Math.min(myTotalPages, current + 1))}
              />

              <section>
                <h2 className="text-[20px] font-extrabold text-[#1f1a52]">
                  View {targetPluralLabel} Comments
                </h2>
                <div className="mt-4 rounded-[24px] border border-[#e3def1] bg-white p-5 shadow-[0_16px_36px_rgba(36,19,95,0.08)]">
                  <div className="rounded-[18px] border border-[#ece7f6] bg-[#faf8ff] px-4 py-4 text-[14px] text-[#6c6684]">
                    {showingTargetDetail
                      ? `Showing anonymous comments for ${
                          selectedTarget?.name || targetLabel
                        } in ${academicYear || "the selected academic year"}.`
                      : `Showing grouped ${targetPluralLabel.toLowerCase()} comments for ${
                          academicYear || "the selected academic year"
                        }.`}
                  </div>

                  <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <p className="text-[15px] font-bold text-[#24135f]">Select Academic Year:</p>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      {showingTargetDetail ? (
                        <button
                          type="button"
                          onClick={handleBackToTargetList}
                          className="min-h-[44px] rounded-full border border-[#d8d2e6] bg-white px-4 py-2 text-[13px] font-semibold text-[#24135f] transition hover:bg-[#f7f4ff]"
                        >
                          Back to {targetPluralLabel}
                        </button>
                      ) : (
                        <>
                          <div className="relative w-full sm:w-[220px]">
                            <Search
                              size={14}
                              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8e89aa]"
                            />
                            <input
                              type="text"
                              value={targetSearchInput}
                              placeholder={`Search ${targetLabel}`}
                              onChange={(event) => {
                                setTargetSearchInput(event.target.value);

                                if (!event.target.value.trim()) {
                                  setTargetPage(1);
                                  setTargetSearchTerm("");
                                }
                              }}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  event.preventDefault();
                                  handleTargetSearch();
                                }
                              }}
                              className="app-input h-[44px] rounded-[16px] pl-9 text-[13px]"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={handleTargetSearch}
                            className="app-btn-primary min-h-[44px] px-4 py-2 text-[13px]"
                          >
                            Search
                          </button>
                        </>
                      )}

                      <div className="lg:w-[190px]">
                        <AcademicYearSelect
                          value={academicYear}
                          options={academicYearOptions.length > 0 ? academicYearOptions : [academicYear || "No Years"]}
                          onChange={handleAcademicYearChange}
                          hideLabel
                          className="justify-end"
                        />
                      </div>
                    </div>
                  </div>

                  {showingTargetDetail ? (
                    <>
                      <div className="mt-5 rounded-[18px] border border-[#ece7f6] bg-white px-4 py-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-[18px] font-bold text-[#24135f]">
                              {selectedTarget?.name || targetLabel}
                            </p>
                            <p className="mt-1 text-[13px] text-[#6c6684]">
                              {selectedTarget?.label || targetLabel} | {academicYear || "-"}
                            </p>
                            <p className="mt-2 text-[13px] font-semibold text-[#24135f]">
                              {totalTargetComments} comment{totalTargetComments === 1 ? "" : "s"} found
                            </p>
                          </div>

                          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
                            <div className="relative w-full sm:w-[250px]">
                              <Search
                                size={14}
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
                              className="app-btn-primary min-h-[44px] px-4 py-2 text-[13px]"
                            >
                              Search Comments
                            </button>

                            <div className="sm:w-[150px]">
                              <AppSelect
                                value={targetDetailPageSize}
                                onChange={(value) => {
                                  setTargetDetailPageSize(value);
                                  setTargetPage(1);
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

                      <div className="mt-5 overflow-hidden rounded-[20px] border border-[#dcd7e7] bg-white shadow-[0_12px_30px_rgba(36,19,95,0.06)]">
                        <div className="flex items-center justify-between border-b border-[#ece7f6] bg-[#faf8ff] px-4 py-4">
                          <h3 className="text-[16px] font-bold text-[#24135f]">Comments list</h3>
                          {targetLoading && <InlineLoadingIndicator label="Refreshing comments..." />}
                        </div>
                        <SummaryCommentsTable comments={targetComments} startIndex={targetStartDisplay} />
                        <PaginationControls
                          start={targetStartDisplay}
                          end={targetEndDisplay}
                          total={totalTargetComments}
                          hasPrevious={targetPage > 1}
                          hasNext={targetPage < targetTotalPages}
                          onPrevious={() => setTargetPage((current) => Math.max(1, current - 1))}
                          onNext={() => setTargetPage((current) => Math.min(targetTotalPages > 0 ? targetTotalPages : 1, current + 1))}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="mt-5 overflow-hidden rounded-[20px] border border-[#dcd7e7] bg-white shadow-[0_12px_30px_rgba(36,19,95,0.06)]">
                      <div className="flex items-center justify-between border-b border-[#ece7f6] bg-[#faf8ff] px-4 py-4">
                        <h3 className="text-[16px] font-bold text-[#24135f]">{targetPluralLabel} list</h3>
                        {targetLoading && <InlineLoadingIndicator label="Refreshing comments..." />}
                      </div>
                      <SummaryCommentsInstructorTable
                        instructors={targets}
                        onSelectInstructor={handleTargetSelect}
                        emptyMessage="No comments found for the selected filters."
                        entityLabel={targetLabel}
                      />
                      <PaginationControls
                        start={targetStartDisplay}
                        end={targetEndDisplay}
                        total={targetTotal}
                        hasPrevious={targetPage > 1}
                        hasNext={targetPage < targetTotalPages}
                        onPrevious={() => setTargetPage((current) => Math.max(1, current - 1))}
                        onNext={() => setTargetPage((current) => Math.min(targetTotalPages > 0 ? targetTotalPages : 1, current + 1))}
                      />
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
