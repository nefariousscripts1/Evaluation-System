"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { UserRound } from "lucide-react";
import AcademicYearSelect from "@/components/secretary/AcademicYearSelect";
import CommentsList from "@/components/faculty/CommentsList";
import PortalPageLoader from "@/components/ui/PortalPageLoader";

type CommentItem = {
  id: string | number;
  comment: string;
  academicYear: string;
  evaluatorName: string;
  evaluatorRole: string;
};

type InstructorCommentsResponse = {
  academicYear: string;
  years: string[];
  comments: CommentItem[];
};

type CommentSectionProps = {
  title: string;
  profileName: string;
  profileRole: string;
  academicYear: string;
  years: string[];
  comments: CommentItem[];
  listTitle: string;
  onYearChange: (value: string) => void;
};

function CommentSection({
  title,
  profileName,
  profileRole,
  academicYear,
  years,
  comments,
  listTitle,
  onYearChange,
}: CommentSectionProps) {
  return (
    <section>
      <h2 className="text-[20px] font-extrabold text-[#1f1a52]">{title}</h2>
      <div className="mt-4 border-t border-[#8e8e8e] pt-4">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#ebdbff] text-[#5c4599]">
            <UserRound size={34} />
          </div>
          <div>
            <p className="text-[18px] font-bold leading-tight text-[#191919]">{profileName}</p>
            <p className="text-[14px] leading-tight text-[#191919]">{profileRole}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <p className="text-[15px] font-bold text-[#191919]">Select Academic Year:</p>
          <div className="xl:w-[190px]">
            <AcademicYearSelect
              value={academicYear}
              options={years.length > 0 ? years : [academicYear || "No Years"]}
              onChange={onYearChange}
              hideLabel
              className="justify-end"
            />
          </div>
        </div>

        <div className="mt-5">
          <CommentsList
            title={listTitle}
            comments={comments}
            emptyMessage="No comments available for the selected academic year."
          />
        </div>
      </div>
    </section>
  );
}

export default function FacultyCommentsPage() {
  const { data: session } = useSession();
  const [academicYear, setAcademicYear] = useState("");
  const [years, setYears] = useState<string[]>([]);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams();
        if (academicYear) params.set("year", academicYear);

        const res = await fetch(`/api/instructor/comments?${params.toString()}`, {
          cache: "no-store",
        });
        const data: InstructorCommentsResponse & { message?: string } = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to load comments");
        }

        setYears(data.years.length > 0 ? data.years : [data.academicYear]);
        setAcademicYear(data.academicYear);
        setComments(data.comments || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load comments");
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [academicYear]);

  const studentComments = useMemo(
    () =>
      comments.filter(
        (comment) => comment.evaluatorRole.toLowerCase() === "student"
      ),
    [comments]
  );

  const chairpersonComments = useMemo(
    () =>
      comments.filter(
        (comment) => comment.evaluatorRole.toLowerCase() === "chairperson"
      ),
    [comments]
  );

  const facultyName = session?.user?.name || "Faculty";
  const chairpersonName =
    chairpersonComments[0]?.evaluatorName || "Chairperson";

  if (loading) {
    return (
      <PortalPageLoader
        title="View Comments"
        description="Loading faculty comments, academic years, and evaluator sections..."
        cards={2}
      />
    );
  }

  return (
    <main className="px-4 pb-4 pt-16 sm:px-5 sm:py-6">
      <div className="mx-auto max-w-[1400px] rounded-[10px] border border-[#dddddd] bg-white px-4 py-5 sm:px-8 sm:py-6">
        <div className="pb-5">
          <h1 className="text-[28px] font-extrabold leading-tight text-[#24135f]">
            View Comments
          </h1>
        </div>

        {error ? (
          <div className="mt-2 rounded-[10px] border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
            <CommentSection
              title="View Students Comments"
              profileName={facultyName}
              profileRole="Faculty"
              academicYear={academicYear}
              years={years}
              comments={studentComments}
              listTitle="Students Comments list"
              onYearChange={setAcademicYear}
            />

            <CommentSection
              title="View Chairperson Comment"
              profileName={chairpersonName}
              profileRole="Chairperson"
              academicYear={academicYear}
              years={years}
              comments={chairpersonComments}
              listTitle="Chairperson Comments list"
              onYearChange={setAcademicYear}
            />
          </div>
        )}
      </div>
    </main>
  );
}
