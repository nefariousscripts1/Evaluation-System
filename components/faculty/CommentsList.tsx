type CommentItem = {
  id: string | number;
  comment: string;
  academicYear: string;
  evaluatorName: string;
  evaluatorRole: string;
};

type Props = {
  title: string;
  comments: CommentItem[];
  emptyMessage?: string;
};

export default function CommentsList({
  title,
  comments,
  emptyMessage = "No comments available for the selected academic year.",
}: Props) {
  return (
    <div className="overflow-hidden rounded-[10px] border border-[#dddddd] bg-white shadow-sm">
      <div className="border-b border-[#ececec] px-5 py-4">
        <h3 className="text-[16px] font-bold leading-tight text-[#24135f]">{title}</h3>
      </div>

      <div className="bg-white">
        {comments.length > 0 ? (
          comments.map((comment, index) => (
            <div
              key={comment.id}
              className="grid min-h-[46px] grid-cols-[56px_1fr] items-start border-t border-[#ececec] first:border-t-0"
            >
              <div className="px-4 py-3 text-[15px] font-bold text-[#111111]">{index + 1}</div>
              <div className="px-4 py-3 text-[15px] text-[#24135f]">{comment.comment}</div>
            </div>
          ))
        ) : (
          <div className="px-5 py-12 text-center text-[#7d7d95]">{emptyMessage}</div>
        )}
      </div>
    </div>
  );
}
