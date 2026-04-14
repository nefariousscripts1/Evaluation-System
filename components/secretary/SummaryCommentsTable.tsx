export type SummaryComment = {
  id: number;
  comment: string;
};

type Props = {
  comments: SummaryComment[];
  startIndex: number;
};

export default function SummaryCommentsTable({ comments, startIndex }: Props) {
  return (
    <div className="rounded-[6px] border border-[#dcd7e7]">
      <div className="hidden overflow-x-auto sm:block">
      <table className="w-full min-w-[560px] text-left">
        <thead className="bg-white">
          <tr className="border-b border-[#ded9ea]">
            <th className="w-[120px] px-4 py-3 text-[12px] font-bold text-[#24135f]">
              Anonymous
            </th>
            <th className="px-4 py-3 text-[12px] font-bold text-[#24135f]">
              Comments
            </th>
          </tr>
        </thead>

        <tbody className="bg-white">
          {comments.length > 0 ? (
            comments.map((comment, index) => (
              <tr key={comment.id} className="border-t border-[#ece7f6]">
                <td className="px-4 py-3 text-[13px] font-semibold text-[#24135f]">
                  {startIndex + index}
                </td>
                <td className="px-4 py-3 text-[13px] text-[#3f3562]">
                  {comment.comment}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={2} className="px-4 py-8 text-center text-[13px] text-[#7d7d95]">
                No summary comments found.
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
              className="rounded-[12px] border border-[#ece7f6] bg-[#fcfbff] p-4"
            >
              <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#7b7498]">
                Anonymous {startIndex + index}
              </p>
              <p className="mt-2 text-[14px] leading-6 text-[#3f3562]">{comment.comment}</p>
            </article>
          ))
        ) : (
          <div className="px-4 py-8 text-center text-[13px] text-[#7d7d95]">
            No summary comments found.
          </div>
        )}
      </div>
    </div>
  );
}
