import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/db";

export default async function ResultsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = session.user.role;
  const userId = Number.parseInt(session.user.id ?? "", 10);
  let results = [];
  let title = "Evaluation Results";

  if (role === "faculty") {
    title = "My Evaluation Results";
    results = await prisma.result.findMany({
      where: { userId },
      include: { user: true },
      orderBy: { academicYear: "desc" },
    });
  } else if (role === "chairperson") {
    title = "Program Faculty Results";
    results = await prisma.result.findMany({
      where: { user: { role: "faculty" } },
      include: { user: true },
      orderBy: { academicYear: "desc" },
    });
  } else if (role === "dean") {
    title = "Department Faculty Results";
    results = await prisma.result.findMany({
      where: { user: { role: "faculty" } },
      include: { user: true },
      orderBy: { academicYear: "desc" },
    });
  } else if (role === "director") {
    title = "Dean Evaluation Results";
    results = await prisma.result.findMany({
      where: { user: { role: "dean" } },
      include: { user: true },
      orderBy: { academicYear: "desc" },
    });
  } else if (role === "campus_director") {
    title = "Director of Instruction Results";
    results = await prisma.result.findMany({
      where: { user: { role: "director" } },
      include: { user: true },
      orderBy: { academicYear: "desc" },
    });
  } else if (role === "secretary") {
    redirect("/secretary/reports");
  } else {
    redirect("/evaluate");
  }

  let comments: Array<{ comment: string | null; label: string }> = [];

  if (role === "faculty") {
    const evaluations = await prisma.evaluation.findMany({
      where: { evaluatedId: userId },
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
    <main className="px-4 py-4 sm:px-5 sm:py-6">
      <div className="mx-auto max-w-[1400px] rounded-[10px] border border-[#dddddd] bg-white px-4 py-5 sm:px-8 sm:py-6">
        <div className="border-b border-[#8e8e8e] pb-5">
          <h1 className="text-[28px] font-extrabold text-[#24135f]">{title}</h1>
        </div>

        <div className="mt-6 grid gap-6">
          {results.map((result) => (
            <div
              key={result.id}
              className="rounded-[10px] border border-[#e7e7e7] bg-white p-6 shadow-sm"
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
            <div className="rounded-[10px] border border-[#e7e7e7] bg-white p-6 text-[#6d6d86]">
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
                  className="rounded-[10px] border border-[#e7e7e7] bg-white p-4 shadow-sm"
                >
                  <p className="text-[#24135f]">{comment.comment}</p>
                  <p className="mt-2 text-xs text-[#9aa0bf]">{comment.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
