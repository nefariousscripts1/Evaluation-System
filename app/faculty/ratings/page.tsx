"use client";

import { useEffect, useState } from "react";
import AcademicYearSelect from "@/components/secretary/AcademicYearSelect";
import RatingSummaryCard from "@/components/faculty/RatingSummaryCard";

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

        const res = await fetch(`/api/instructor/ratings?${params.toString()}`, {
          cache: "no-store",
        });
        const data: InstructorRatingsResponse & { message?: string } = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to load ratings");
        }

        setYears(data.years.length > 0 ? data.years : [data.academicYear]);
        setAcademicYear(data.academicYear);
        setStudentEvaluations(data.studentEvaluations);
        setChairpersonEvaluation(data.chairpersonEvaluation);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load ratings");
      } finally {
        setLoading(false);
      }
    };

    fetchRatings();
  }, [academicYear]);

  return (
    <main className="px-4 py-4 sm:px-5 sm:py-6">
      <div className="mx-auto max-w-[1400px] rounded-[10px] border border-[#dddddd] bg-white px-4 py-5 sm:px-8 sm:py-6">
        <div className="border-b border-[#8e8e8e] pb-5">
          <h1 className="text-[28px] font-extrabold text-[#24135f]">View My Ratings</h1>
        </div>

        <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
          <AcademicYearSelect
            value={academicYear}
            options={years.length > 0 ? years : [academicYear || "No Years"]}
            onChange={setAcademicYear}
          />
        </div>

        {loading ? (
          <div className="py-16 text-center text-[#24135f]">Loading ratings...</div>
        ) : error ? (
          <div className="mt-6 rounded-[10px] border border-red-200 bg-red-50 p-4 text-red-700">
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
