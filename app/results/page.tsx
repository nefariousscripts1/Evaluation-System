import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { getDefaultRouteForRole } from "@/lib/server-auth";
import { getReleasedAcademicYears } from "@/lib/results-release";

export default async function ResultsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const role = session.user.role;
  const userId = Number.parseInt(session.user.id ?? "", 10);
  const releasedYears = await getReleasedAcademicYears();
  const releasedYearsFilter = releasedYears.length > 0 ? releasedYears : ["__never__"];

  if (role && role !== "faculty") {
    redirect(getDefaultRouteForRole(session));
  }

  let results = [];
  let title = "Evaluation Results";

  if (role === "faculty") {
    title = "My Evaluation Results";
    results = await prisma.result.findMany({
      where: {
        userId,
        academicYear: { in: releasedYearsFilter },
      },
      include: { user: true },
      orderBy: { academicYear: "desc" },
    });
  } else {
    redirect("/evaluate");
  }

  let comments: Array<{ comment: string | null; label: string }> = [];

  if (role === "faculty") {
    const evaluations = await prisma.evaluation.findMany({
      where: {
        evaluatedId: userId,
        academicYear: { in: releasedYearsFilter },
      },
      include: {
        answers: {
          where: { comment: { not: null } },
          include: { questionnaire: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    comments = evaluations.flatMap((evaluation) => {
      const overallComment = evaluation.generalComment
        ? [
            {
              comment: evaluation.generalComment,
              label: `Overall feedback (${evaluation.academicYear})`,
            },
          ]
        : [];

      const legacyComments = evaluation.answers.map((answer) => ({
        comment: answer.comment,
        label: answer.questionnaire?.questionText
          ? `Question: ${answer.questionnaire.questionText}`
          : "Question comment",
      }));

      return [...overallComment, ...legacyComments];
    });
  }

  return (
    <main className="app-page">
      <div className="app-page-card">
        <div className="border-b border-[#ece7f6] pb-5">
          <h1 className="text-[28px] font-extrabold text-[#24135f]">{title}</h1>
        </div>

        {releasedYears.length === 0 ? (
          <div className="mt-6 rounded-[22px] border border-amber-200 bg-amber-50 p-6 text-amber-800 shadow-[0_12px_28px_rgba(36,19,95,0.06)]">
            Evaluation results are not available yet. Please wait for the secretary to release them.
          </div>
        ) : (
          <>
            <div className="mt-6 grid gap-6">
              {results.map((result) => (
                <div
                  key={result.id}
                  className="rounded-[22px] border border-[#e7e7e7] bg-white p-6 shadow-[0_16px_36px_rgba(36,19,95,0.08)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-[20px] font-bold text-[#24135f]">
                        {result.user.name || result.user.email}
                      </h2>
                      <p className="text-[14px] text-[#6d6d86]">Role: {result.user.role}</p>
                    </div>
                    <span className="text-[14px] text-[#6d6d86]">{result.academicYear}</span>
                  </div>

                  <div className="mt-5 flex items-center gap-3">
                    <div className="text-[38px] font-extrabold leading-none text-[#12385b]">
                      {result.averageRating.toFixed(1)}
                    </div>
                    <div className="text-[14px] text-[#6d6d86]">/ 5.0</div>
                    <div className="flex text-[28px] leading-none text-[#ffc627]">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star}>
                          {star <= Math.round(result.averageRating) ? "★" : "☆"}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {results.length === 0 && (
                <div className="rounded-[22px] border border-[#e7e7e7] bg-white p-6 text-[#6d6d86] shadow-[0_12px_28px_rgba(36,19,95,0.06)]">
                  No results available.
                </div>
              )}
            </div>

            {comments.length > 0 && (
              <div className="mt-8">
                <h2 className="mb-4 text-[20px] font-bold text-[#24135f]">Summary Comments</h2>
                <div className="space-y-4">
                  {comments.map((comment, idx) => (
                    <div
                      key={idx}
                      className="rounded-[18px] border border-[#e7e7e7] bg-white p-4 shadow-[0_12px_28px_rgba(36,19,95,0.06)]"
                    >
                      <p className="text-[#24135f]">{comment.comment}</p>
                      <p className="mt-2 text-xs text-[#9aa0bf]">{comment.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
