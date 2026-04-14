"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import RoleCommentsPanel from "@/components/comments/RoleCommentsPanel";
import { SummaryComment } from "@/components/secretary/SummaryCommentsTable";

type CommentItem = {
  id: number;
  comment: string;
  academicYear: string;
  evaluatorName: string;
  evaluatorRole: string;
};

type ChairpersonCommentsResponse = {
  academicYear: string;
  years: string[];
  semesters: string[];
  semester: string;
  mySummaryComments: CommentItem[];
  facultyComments: {
    selectedFaculty: {
      id: number;
      name: string;
      label: string;
    } | null;
    comments: SummaryComment[];
    total: number;
  };
};

type FacultyOption = {
  id: number;
  label: string;
  sublabel?: string;
};

const pageSize = 5;

export default function ChairpersonCommentsPage() {
  const { data: session } = useSession();
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFacultyId, setSelectedFacultyId] = useState<number | null>(null);
  const [facultyOptions, setFacultyOptions] = useState<FacultyOption[]>([]);
  const [academicYear, setAcademicYear] = useState("");
  const [academicYearOptions, setAcademicYearOptions] = useState<string[]>([]);
  const [semester, setSemester] = useState("all");
  const [myPage, setMyPage] = useState(1);
  const [facultyPage, setFacultyPage] = useState(1);
  const [mySummaryComments, setMySummaryComments] = useState<CommentItem[]>([]);
  const [facultyComments, setFacultyComments] = useState<SummaryComment[]>([]);
  const [selectedFaculty, setSelectedFaculty] =
    useState<ChairpersonCommentsResponse["facultyComments"]["selectedFaculty"]>(null);
  const [totalFacultyComments, setTotalFacultyComments] = useState(0);
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
    const fetchComments = async () => {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams({
          page: String(facultyPage),
          pageSize: String(pageSize),
          semester,
        });

        if (searchTerm) {
          params.set("search", searchTerm);
        }

        if (selectedFacultyId) {
          params.set("facultyId", String(selectedFacultyId));
        }

        if (academicYear) {
          params.set("academicYear", academicYear);
        }

        const res = await fetch(`/api/chairperson/comments?${params.toString()}`, {
          cache: "no-store",
        });
        const data: ChairpersonCommentsResponse & { message?: string } = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to load chairperson comments");
        }

        setAcademicYear(data.academicYear);
        setAcademicYearOptions(data.years.length > 0 ? data.years : [data.academicYear]);
        setSemester(data.semester);
        setMySummaryComments(data.mySummaryComments || []);
        setSelectedFaculty(data.facultyComments.selectedFaculty);
        setFacultyComments(data.facultyComments.comments || []);
        setTotalFacultyComments(data.facultyComments.total || 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load chairperson comments");
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [academicYear, facultyPage, searchTerm, selectedFacultyId, semester]);

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

  const facultyStartIndex = (facultyPage - 1) * pageSize;
  const facultyStartDisplay = totalFacultyComments === 0 ? 0 : facultyStartIndex + 1;
  const facultyEndDisplay = Math.min(facultyStartIndex + pageSize, totalFacultyComments);
  const facultyTotalPages = Math.max(1, Math.ceil(totalFacultyComments / pageSize));

  const handleSearch = () => {
    setFacultyPage(1);
    setSearchTerm(searchInput.trim());
  };

  const handleSuggestionSelect = (suggestion: FacultyOption) => {
    setSearchInput(suggestion.label);
    setSearchTerm(suggestion.label);
    setSelectedFacultyId(suggestion.id);
    setFacultyPage(1);
  };

  const handleAcademicYearChange = (value: string) => {
    setAcademicYear(value);
    setMyPage(1);
    setFacultyPage(1);
  };

  if (loading) {
    return (
      <main className="px-4 py-4 sm:px-5 sm:py-6">
        <div className="mx-auto max-w-[1380px] rounded-[18px] border border-[#dddddd] bg-white p-6 text-center text-[#24135f] sm:p-8">
          Loading comments...
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 py-4 sm:px-5 sm:py-6">
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
            <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
              <RoleCommentsPanel
                title="View My Summary Comments"
                profileName={session?.user?.name || "Chairperson"}
                profileRole="Chairperson"
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
                title="View Faculty Comments"
                profileName={selectedFaculty?.name || "Faculty"}
                profileRole={selectedFaculty?.label || "Faculty"}
                academicYear={academicYear}
                years={academicYearOptions}
                comments={facultyComments}
                start={facultyStartDisplay}
                end={facultyEndDisplay}
                total={totalFacultyComments}
                hasPrevious={facultyPage > 1}
                hasNext={facultyPage < facultyTotalPages}
                onYearChange={handleAcademicYearChange}
                onPrevious={() => setFacultyPage((current) => Math.max(1, current - 1))}
                onNext={() =>
                  setFacultyPage((current) => Math.min(facultyTotalPages, current + 1))
                }
                searchInput={searchInput}
                searchPlaceholder="Search Faculty"
                onSearchInputChange={(value) => {
                  setSearchInput(value);
                  setSelectedFacultyId(null);
                }}
                onSearch={handleSearch}
                suggestions={facultyOptions}
                onSuggestionSelect={handleSuggestionSelect}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
