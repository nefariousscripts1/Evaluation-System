import { Star } from "lucide-react";

type Props = {
  rating: number;
};

export default function StarRatingDisplay({ rating }: Props) {
  const rounded = Math.round(rating);

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={18}
            className={
              star <= rounded ? "fill-[#f4c542] text-[#f4c542]" : "text-[#d8d2ea]"
            }
          />
        ))}
      </div>
      <span className="text-[16px] font-bold text-[#24135f]">
        {rating.toFixed(2)}
      </span>
    </div>
  );
}
