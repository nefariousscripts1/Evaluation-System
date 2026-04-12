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
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <p className="text-[13px] font-semibold text-[#24135f]">
        {total === 0 ? "0 - 0 of 0" : `${start} - ${end} of ${total}`}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrevious}
          disabled={!hasPrevious}
          className="flex h-8 w-8 items-center justify-center rounded-[4px] border border-[#d7d2e4] bg-white text-[#24135f] transition hover:bg-[#f6f4fb] disabled:cursor-not-allowed disabled:opacity-50"
        >
          -
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!hasNext}
          className="flex h-8 w-8 items-center justify-center rounded-[4px] bg-[#24135f] text-white transition hover:bg-[#1b0f4d] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
