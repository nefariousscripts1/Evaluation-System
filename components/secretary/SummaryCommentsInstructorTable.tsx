export type SummaryCommentsInstructorRow = {
  instructor_id: number;
  instructor_name: string;
  academic_year: string;
  semester: string;
  total_comments: number;
};

type Props = {
  instructors: SummaryCommentsInstructorRow[];
  onSelectInstructor: (instructorId: number) => void;
  emptyMessage?: string;
  entityLabel?: string;
};

export default function SummaryCommentsInstructorTable({
  instructors,
  onSelectInstructor,
  emptyMessage = "No comments found for the selected filters.",
  entityLabel = "Instructor",
}: Props) {
  return (
    <div className="overflow-hidden rounded-[18px] border border-[#e1dcef] bg-white shadow-[0_12px_30px_rgba(36,19,95,0.06)]">
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[900px] text-left">
          <thead className="bg-[#f8f5ff]">
            <tr className="border-b border-[#e7e1f2]">
              <th className="px-5 py-4 text-[12px] font-bold uppercase tracking-[0.14em] text-[#24135f]">
                {entityLabel}
              </th>
              <th className="w-[160px] px-5 py-4 text-[12px] font-bold uppercase tracking-[0.14em] text-[#24135f]">
                Academic Year
              </th>
              <th className="w-[170px] px-5 py-4 text-[12px] font-bold uppercase tracking-[0.14em] text-[#24135f]">
                Semester
              </th>
              <th className="w-[140px] px-5 py-4 text-[12px] font-bold uppercase tracking-[0.14em] text-[#24135f]">
                Total Comments
              </th>
              <th className="w-[170px] px-5 py-4 text-[12px] font-bold uppercase tracking-[0.14em] text-[#24135f]">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="bg-white">
            {instructors.length > 0 ? (
              instructors.map((instructor) => (
                <tr
                  key={instructor.instructor_id}
                  className="border-t border-[#ece7f6] transition hover:bg-[#fcfbff]"
                >
                  <td className="px-5 py-4 text-[14px] font-semibold text-[#24135f]">
                    <button
                      type="button"
                      onClick={() => onSelectInstructor(instructor.instructor_id)}
                      className="text-left underline-offset-2 hover:underline"
                    >
                      {instructor.instructor_name}
                    </button>
                  </td>
                  <td className="px-5 py-4 text-[13px] text-[#3f3562]">{instructor.academic_year}</td>
                  <td className="px-5 py-4 text-[13px] text-[#3f3562]">{instructor.semester}</td>
                  <td className="px-5 py-4 text-[13px] font-semibold text-[#24135f]">
                    {instructor.total_comments}
                  </td>
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => onSelectInstructor(instructor.instructor_id)}
                      className="rounded-full bg-[#24135f] px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-[#1b0f4d]"
                    >
                      View Comments
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[13px] text-[#7d7d95]">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 p-3 sm:hidden">
        {instructors.length > 0 ? (
          instructors.map((instructor) => (
            <article
              key={instructor.instructor_id}
              className="rounded-[16px] border border-[#ece7f6] bg-white p-4 shadow-[0_10px_24px_rgba(36,19,95,0.05)]"
            >
              <button
                type="button"
                onClick={() => onSelectInstructor(instructor.instructor_id)}
                className="text-left text-[15px] font-semibold text-[#24135f] underline-offset-2 hover:underline"
              >
                {instructor.instructor_name}
              </button>
              <p className="mt-2 text-[13px] text-[#7b7498]">
                {instructor.academic_year} | {instructor.semester}
              </p>
              <p className="mt-2 text-[13px] font-semibold text-[#24135f]">
                {instructor.total_comments} comment{instructor.total_comments === 1 ? "" : "s"}
              </p>
              <button
                type="button"
                onClick={() => onSelectInstructor(instructor.instructor_id)}
                className="mt-3 rounded-full bg-[#24135f] px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-[#1b0f4d]"
              >
                View Comments
              </button>
            </article>
          ))
        ) : (
          <div className="px-4 py-8 text-center text-[13px] text-[#7d7d95]">{emptyMessage}</div>
        )}
      </div>
    </div>
  );
}
