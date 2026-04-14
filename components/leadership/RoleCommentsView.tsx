"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import RoleCommentsPanel from "@/components/comments/RoleCommentsPanel";
import { SummaryComment } from "@/components/secretary/SummaryCommentsTable";
import PortalPageLoader from "@/components/ui/PortalPageLoader";

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
    comments: SummaryComment[];
    total: number;
  };
};

type TargetOption = {
  id: number;
  label: string;
  sublabel?: string;
};

type RoleCommentsViewProps = {
  apiEndpoint: string;
  viewerRoleLabel: string;
  targetLabel: string;
  targetPluralLabel: string;
};

const pageSize = 5;

export default function RoleCommentsView({
  apiEndpoint,
  viewerRoleLabel,
  targetLabel,
  targetPluralLabel,
}: RoleCommentsViewProps) {
  const { data: session } = useSession();
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTargetId, setSelectedTargetId] = useState<number | null>(null);
  const [targetOptions, setTargetOptions] = useState<TargetOption[]>([]);
  const [academicYear, setAcademicYear] = useState("");
  const [academicYearOptions, setAcademicYearOptions] = useState<string[]>([]);
  const [semester, setSemester] = useState("all");
  const [semesterOptions, setSemesterOptions] = useState<string[]>(["All Semesters"]);
  const [myPage, setMyPage] = useState(1);
  const [targetPage, setTargetPage] = useState(1);
  const [mySummaryComments, setMySummaryComments] = useState<CommentItem[]>([]);
  const [targetComments, setTargetComments] = useState<SummaryComment[]>([]);
  const [selectedTarget, setSelectedTarget] =
    useState<LeadershipCommentsResponse["targetComments"]["selectedTarget"]>(null);
  const [totalTargetComments, setTotalTargetComments] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [targetLoading, setTargetLoading] = useState(false);
  const [error, setError] = useState("");
  const hasLoadedOnceRef = useRef(false);

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
    const fetchComments = async () => {
      try {
        if (!hasLoadedOnceRef.current) {
          setInitialLoading(true);
        } else {
          setTargetLoading(true);
        }
        setError("");

        const params = new URLSearchParams({
          page: String(targetPage),
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
        const data: LeadershipCommentsResponse & { message?: string } = await res.json();

        if (!res.ok) {
          throw new Error(data.message || `Failed to load ${targetLabel.toLowerCase()} comments`);
        }

        setAcademicYear(data.academicYear);
        setAcademicYearOptions(data.years.length > 0 ? data.years : [data.academicYear]);
        setSemester(data.semester);
        setSemesterOptions(data.semesters.length > 0 ? data.semesters : ["All Semesters"]);
        setMySummaryComments(data.mySummaryComments || []);
        setSelectedTarget(data.targetComments.selectedTarget);
        setTargetComments(data.targetComments.comments || []);
        setTotalTargetComments(data.targetComments.total || 0);
        hasLoadedOnceRef.current = true;
      } catch (err) {
        setError(err instanceof Error ? err.message : `Failed to load ${targetLabel.toLowerCase()} comments`);
      } finally {
        setInitialLoading(false);
        setTargetLoading(false);
      }
    };

    fetchComments();
  }, [academicYear, apiEndpoint, searchTerm, selectedTargetId, semester, targetLabel, targetPage]);

  const myCommentsTableData = useMemo<SummaryComment[]>(() => {
    return mySummaryComments.map((comment) => ({
      id: comment.id,
      comment: comment.comment,
    }));
  }, [mySummaryComments]);

  const myStartIndex = (myPage - 1) * pageSize;
  const myVisibleComments = myCommentsTableData.slice(myStartIndex, myStartIndex + pageSize);
  const myTotal = myCommentsTableData.length;
  const myStartDisplay = myTotal === 0 ? 0 : myStartIndex + 1;
  const myEndDisplay = Math.min(myStartIndex + pageSize, myTotal);
  const myTotalPages = Math.max(1, Math.ceil(myTotal / pageSize));

  const targetStartIndex = (targetPage - 1) * pageSize;
  const targetStartDisplay = totalTargetComments === 0 ? 0 : targetStartIndex + 1;
  const targetEndDisplay = Math.min(targetStartIndex + pageSize, totalTargetComments);
  const targetTotalPages = Math.max(1, Math.ceil(totalTargetComments / pageSize));

  const handleSearch = () => {
    setTargetPage(1);
    setSearchTerm(searchInput.trim());
  };

  const handleSuggestionSelect = (suggestion: TargetOption) => {
    setSearchInput(suggestion.label);
    setSearchTerm(suggestion.label);
    setSelectedTargetId(suggestion.id);
    setTargetPage(1);
  };

  const handleAcademicYearChange = (value: string) => {
    setAcademicYear(value);
    setMyPage(1);
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
    <main className="px-4 pb-4 pt-16 sm:px-5 sm:py-6">
      <div className="mx-auto max-w-[1380px] rounded-[10px] border border-[#dddddd] bg-white px-4 py-5 sm:px-8 sm:py-6">
        <div className="pb-5">
          <h1 className="text-[28px] font-extrabold leading-tight text-[#24135f]">
            View Comments
          </h1>
        </div>

        {error ? (
          <div className="rounded-[10px] border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        ) : (
          <div className="rounded-[10px] border border-[#dddddd] bg-white p-4 sm:p-6">
            <div className="mb-4 flex justify-end">
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
                <label className="text-[14px] font-semibold text-[#24135f]">Semester</label>
                <select
                  value={semester}
                  onChange={(event) => {
                    setSemester(event.target.value);
                    setTargetPage(1);
                  }}
                  className="h-[44px] w-full rounded-[8px] border border-[#d2cae8] bg-white px-3 text-[13px] text-[#24135f] outline-none focus:border-[#24135f] sm:h-[40px] sm:w-auto"
                >
                  {semesterOptions.map((option) => {
                    const normalized = option.toLowerCase() === "all semesters" ? "all" : option;
                    return (
                      <option key={option} value={normalized}>
                        {option}
                      </option>
                    );
                  })}
                </select>
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

              <RoleCommentsPanel
                title={`View ${targetPluralLabel} Comments`}
                profileName={selectedTarget?.name || targetLabel}
                profileRole={selectedTarget?.label || targetLabel}
                academicYear={academicYear}
                years={academicYearOptions}
                comments={targetComments}
                start={targetStartDisplay}
                end={targetEndDisplay}
                total={totalTargetComments}
                hasPrevious={targetPage > 1}
                hasNext={targetPage < targetTotalPages}
                onYearChange={handleAcademicYearChange}
                onPrevious={() => setTargetPage((current) => Math.max(1, current - 1))}
                onNext={() => setTargetPage((current) => Math.min(targetTotalPages, current + 1))}
                isLoading={targetLoading}
                searchInput={searchInput}
                searchPlaceholder={`Search ${targetLabel}`}
                onSearchInputChange={(value) => {
                  setSearchInput(value);
                  setSelectedTargetId(null);

                  if (!value.trim()) {
                    setTargetPage(1);
                    setSearchTerm("");
                  }
                }}
                onSearch={handleSearch}
                suggestions={targetOptions}
                onSuggestionSelect={handleSuggestionSelect}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
