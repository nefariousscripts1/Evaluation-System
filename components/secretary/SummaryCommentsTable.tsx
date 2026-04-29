export type SummaryComment = {
  id: string | number;
  anonymous_number?: number;
  comment: string;
  instructor_id?: number;
  instructor_name?: string;
  academic_year?: string;
  semester?: string;
  created_at?: string;
};

type Props = {
  comments: SummaryComment[];
  startIndex: number;
  emptyMessage?: string;
};

export default function SummaryCommentsTable({
  comments,
  startIndex,
  emptyMessage = "No comments found for the selected filters.",
}: Props) {
  return (
    <div className="overflow-hidden rounded-[18px] border border-[#e1dcef] bg-white shadow-[0_12px_30px_rgba(36,19,95,0.06)]">
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[860px] text-left">
          <thead className="bg-[#f8f5ff]">
            <tr className="border-b border-[#e7e1f2]">
              <th className="w-[120px] px-5 py-4 text-[12px] font-bold uppercase tracking-[0.14em] text-[#24135f]">
                Anonymous
              </th>
              <th className="w-[240px] px-5 py-4 text-[12px] font-bold uppercase tracking-[0.14em] text-[#24135f]">
                Instructor
              </th>
              <th className="w-[150px] px-5 py-4 text-[12px] font-bold uppercase tracking-[0.14em] text-[#24135f]">
                Academic Year
              </th>
              <th className="w-[150px] px-5 py-4 text-[12px] font-bold uppercase tracking-[0.14em] text-[#24135f]">
                Semester
              </th>
              <th className="px-5 py-4 text-[12px] font-bold uppercase tracking-[0.14em] text-[#24135f]">
                Comments
              </th>
            </tr>
          </thead>

          <tbody className="bg-white">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <tr
                  key={comment.id}
                  className="border-t border-[#ece7f6] transition hover:bg-[#fcfbff]"
                >
                  <td className="px-5 py-4 text-[13px] font-semibold text-[#24135f]">
                    {comment.anonymous_number || startIndex}
                  </td>
                  <td className="px-5 py-4 text-[13px] font-semibold text-[#24135f]">
                    {comment.instructor_name || "Instructor"}
                  </td>
                  <td className="px-5 py-4 text-[13px] text-[#3f3562]">
                    {comment.academic_year || "-"}
                  </td>
                  <td className="px-5 py-4 text-[13px] text-[#3f3562]">
                    {comment.semester || "-"}
                  </td>
                  <td className="px-5 py-4 text-[13px] leading-6 text-[#3f3562]">
                    {comment.comment}
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
        {comments.length > 0 ? (
          comments.map((comment, index) => (
            <article
              key={comment.id}
              className="rounded-[16px] border border-[#ece7f6] bg-white p-4 shadow-[0_10px_24px_rgba(36,19,95,0.05)]"
            >
              <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#7b7498]">
                Anonymous {comment.anonymous_number || startIndex + index}
              </p>
              <p className="mt-2 text-[14px] font-semibold text-[#24135f]">
                {comment.instructor_name || "Instructor"}
              </p>
              <p className="mt-1 text-[12px] text-[#7b7498]">
                {comment.academic_year || "-"} | {comment.semester || "-"}
              </p>
              <p className="mt-2 text-[14px] leading-6 text-[#3f3562]">{comment.comment}</p>
            </article>
          ))
        ) : (
          <div className="px-4 py-8 text-center text-[13px] text-[#7d7d95]">
            {emptyMessage}
          </div>
        )}
      </div>
    </div>
  );
}
