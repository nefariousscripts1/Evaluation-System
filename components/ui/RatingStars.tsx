"use client";

export default function RatingStars({
  value,
  onChange,
}: {
  value: number;
  onChange: (rating: number) => void;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="focus:outline-none text-2xl"
        >
          <span className={star <= value ? "text-accent" : "text-gray-300"}>★</span>
        </button>
      ))}
    </div>
  );
}