import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/db";

export default async function ResultsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = session.user.role;
  const userId = parseInt(session.user.id);
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

  // Get comments for faculty
  let comments: any[] = [];
  if (role === "faculty") {
    const evaluations = await prisma.evaluation.findMany({
      where: { evaluatedId: userId },
      include: {
        answers: {
          where: { comment: { not: null } },
          include: { question: true },
        },
      },
    });
    comments = evaluations.flatMap(e => e.answers);
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-6 text-2xl font-bold">{title}</h1>
      <div className="grid gap-6">
        {results.map((result) => (
          <div key={result.id} className="rounded-lg bg-white p-6 shadow">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold">{result.user.name || result.user.email}</h2>
                <p className="text-sm text-gray-500">Role: {result.user.role}</p>
              </div>
              <span className="text-sm text-gray-500">{result.academicYear}</span>
            </div>
            <div className="mt-4 flex items-center">
              <div className="text-4xl font-bold text-primary">{result.averageRating.toFixed(1)}</div>
              <div className="ml-2 text-gray-500">/ 5.0</div>
              <div className="ml-4 flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className={`text-2xl ${star <= Math.round(result.averageRating) ? "text-accent" : "text-gray-300"}`}>
                    ★
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
        {results.length === 0 && (
          <p className="text-gray-500">No results available.</p>
        )}
      </div>

      {comments.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Summary Comments</h2>
          <div className="space-y-4">
            {comments.map((comment, idx) => (
              <div key={idx} className="rounded-lg bg-white p-4 shadow">
                <p className="text-gray-700">{comment.comment}</p>
                <p className="text-xs text-gray-400 mt-2">Question: {comment.question?.questionText}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}