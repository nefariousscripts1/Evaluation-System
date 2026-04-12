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
    <div className="overflow-x-auto rounded-[6px] border border-[#dcd7e7]">
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
  );
}
