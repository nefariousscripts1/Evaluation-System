import { ChevronRight } from "lucide-react";

type Props = {
  start: number;
  end: number;
  total: number;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
};

export default function PaginationControls({
  start,
  end,
  total,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
}: Props) {
  return (
    <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5">
      <p className="text-[13px] font-semibold text-[#24135f]">
        {total === 0 ? "0 - 0 of 0" : `${start} - ${end} of ${total}`}
      </p>

      <div className="flex w-full items-center gap-2 sm:w-auto sm:justify-end">
        <button
          type="button"
          onClick={onPrevious}
          disabled={!hasPrevious}
          className="flex h-11 flex-1 items-center justify-center rounded-[6px] border border-[#d7d2e4] bg-white px-4 text-[13px] font-semibold text-[#24135f] transition hover:bg-[#f6f4fb] disabled:cursor-not-allowed disabled:opacity-50 sm:h-8 sm:w-8 sm:flex-none sm:rounded-[4px] sm:px-0"
        >
          <span className="sm:hidden">Prev</span>
          <span className="hidden sm:inline">-</span>
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!hasNext}
          className="flex h-11 flex-1 items-center justify-center gap-1 rounded-[6px] bg-[#24135f] px-4 text-[13px] font-semibold text-white transition hover:bg-[#1b0f4d] disabled:cursor-not-allowed disabled:opacity-50 sm:h-8 sm:w-8 sm:flex-none sm:rounded-[4px] sm:px-0"
        >
          <span className="sm:hidden">Next</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
