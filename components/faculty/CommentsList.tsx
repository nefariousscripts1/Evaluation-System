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
    <div className="overflow-hidden rounded-[20px] border border-[#e3def1] bg-white shadow-[0_14px_32px_rgba(36,19,95,0.06)]">
      <div className="border-b border-[#ece7f6] bg-[#faf8ff] px-5 py-4">
        <h3 className="text-[16px] font-bold leading-tight text-[#24135f]">{title}</h3>
      </div>

      <div className="hidden bg-white sm:block">
        {comments.length > 0 ? (
          comments.map((comment, index) => (
            <div
              key={comment.id}
              className="grid min-h-[54px] grid-cols-[64px_1fr] items-start border-t border-[#ece7f6] first:border-t-0 hover:bg-[#fcfbff]"
            >
              <div className="px-5 py-4 text-[15px] font-bold text-[#24135f]">{index + 1}</div>
              <div className="px-5 py-4 text-[15px] leading-7 text-[#24135f]">{comment.comment}</div>
            </div>
          ))
        ) : (
          <div className="px-5 py-12 text-center text-[#7d7d95]">{emptyMessage}</div>
        )}
      </div>

      <div className="bg-white sm:hidden">
        {comments.length > 0 ? (
          <div className="space-y-3 p-3">
            {comments.map((comment, index) => (
              <article
                key={comment.id}
                className="rounded-[16px] border border-[#ece7f6] bg-white p-4 shadow-[0_10px_24px_rgba(36,19,95,0.05)]"
              >
                <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#7b7498]">
                  Comment {index + 1}
                </p>
                <p className="mt-2 text-[14px] leading-6 text-[#24135f]">{comment.comment}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="px-5 py-12 text-center text-[#7d7d95]">{emptyMessage}</div>
        )}
      </div>
    </div>
  );
}
