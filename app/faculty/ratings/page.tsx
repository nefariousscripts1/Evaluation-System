"use client";

import { useEffect, useState } from "react";
import AcademicYearSelect from "@/components/secretary/AcademicYearSelect";
import RatingSummaryCard from "@/components/faculty/RatingSummaryCard";
import AppSelect from "@/components/ui/AppSelect";
import PortalPageLoader from "@/components/ui/PortalPageLoader";
import { getApiErrorMessage, readApiResponse } from "@/lib/client-api";

type RatingBreakdown = {
  fiveStar: number;
  fourStar: number;
  threeStar: number;
  twoStar: number;
  oneStar: number;
};

type EvaluationSummary = {
  evaluatorName: string;
  evaluatorRole: string;
  overallRating: number;
  breakdown: RatingBreakdown;
  totalRatings: number;
};

type InstructorRatingsResponse = {
  academicYear: string;
  years: string[];
  semesters: string[];
  semester: string;
  studentEvaluations: EvaluationSummary;
  chairpersonEvaluation: EvaluationSummary;
};

function emptySummary(label: string): EvaluationSummary {
  return {
    evaluatorName: label,
    evaluatorRole: label === "Students" ? "Student" : "Chairperson",
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

export default function FacultyRatingsPage() {
  const [academicYear, setAcademicYear] = useState("");
  const [years, setYears] = useState<string[]>([]);
  const [semester, setSemester] = useState("");
  const [semesters, setSemesters] = useState<string[]>([]);
  const [studentEvaluations, setStudentEvaluations] = useState<EvaluationSummary>(
    emptySummary("Students")
  );
  const [chairpersonEvaluation, setChairpersonEvaluation] = useState<EvaluationSummary>(
    emptySummary("Chairperson")
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams();
        if (academicYear) params.set("year", academicYear);
        if (semester) params.set("semester", semester);

        const res = await fetch(`/api/instructor/ratings?${params.toString()}`, {
          cache: "no-store",
        });
        const data = await readApiResponse<InstructorRatingsResponse>(res);

        setYears(data.years.length > 0 ? data.years : [data.academicYear]);
        setAcademicYear(data.academicYear);
        setSemester(data.semester);
        setSemesters(data.semesters);
        setStudentEvaluations(data.studentEvaluations);
        setChairpersonEvaluation(data.chairpersonEvaluation);
      } catch (err) {
        setError(getApiErrorMessage(err, "Failed to load ratings"));
      } finally {
        setLoading(false);
      }
    };

    fetchRatings();
  }, [academicYear, semester]);

  if (loading) {
    return (
      <PortalPageLoader
        title="View My Ratings"
        description="Loading faculty rating summaries and breakdowns..."
        cards={2}
      />
    );
  }

  return (
    <main className="app-page-with-topbar">
      <div className="app-page-card">
        <div className="border-b border-[#ece7f6] pb-5">
          <h1 className="text-[28px] font-extrabold text-[#24135f]">View My Ratings</h1>
        </div>

        <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
          <div className="w-full md:max-w-[220px]">
            <AppSelect
              value={semester}
              onChange={setSemester}
              options={semesters.map((option) => ({ value: option, label: option }))}
              triggerClassName="min-h-[46px] rounded-[16px] text-[14px] sm:min-h-[44px]"
            />
          </div>
          <AcademicYearSelect
            value={academicYear}
            options={years.length > 0 ? years : academicYear ? [academicYear] : []}
            onChange={setAcademicYear}
          />
        </div>

        {error ? (
          <div className="app-alert-danger mt-6">
            {error}
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
            <RatingSummaryCard
              title="Student Evaluations"
              evaluatorName={studentEvaluations.evaluatorName}
              evaluatorRole={studentEvaluations.evaluatorRole}
              overallRating={studentEvaluations.overallRating}
              breakdown={studentEvaluations.breakdown}
              totalRatings={studentEvaluations.totalRatings}
            />

            <RatingSummaryCard
              title="Chairperson Evaluation"
              evaluatorName={chairpersonEvaluation.evaluatorName}
              evaluatorRole={chairpersonEvaluation.evaluatorRole}
              overallRating={chairpersonEvaluation.overallRating}
              breakdown={chairpersonEvaluation.breakdown}
              totalRatings={chairpersonEvaluation.totalRatings}
            />
          </div>
        )}
      </div>
    </main>
  );
}
