import ProfileInfoCard from "@/components/secretary/ProfileInfoCard";
import RatingBreakdownList from "./RatingBreakdownList";
import StarRatingDisplay from "./StarRatingDisplay";

type RatingBreakdown = {
  fiveStar: number;
  fourStar: number;
  threeStar: number;
  twoStar: number;
  oneStar: number;
};

type Props = {
  title: string;
  evaluatorName: string;
  evaluatorRole: string;
  overallRating: number;
  breakdown: RatingBreakdown;
  totalRatings: number;
};

export default function RatingSummaryCard({
  title,
  evaluatorName,
  evaluatorRole,
  overallRating,
  breakdown,
  totalRatings,
}: Props) {
  return (
    <section className="rounded-[18px] border border-[#dddddd] bg-white p-4 sm:p-5">
      <h2 className="text-[20px] font-extrabold text-[#24135f] sm:text-[22px]">{title}</h2>

      <div className="mt-5 space-y-5">
        <ProfileInfoCard name={evaluatorName} label={evaluatorRole} />

        <div className="rounded-[12px] border border-[#e8e4f3] bg-white px-4 py-4 sm:px-5">
          <p className="text-[14px] font-bold text-[#24135f]">Overall Rating</p>
          <div className="mt-3 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="text-[34px] font-extrabold leading-none text-[#24135f] sm:text-[40px]">
              {overallRating.toFixed(2)}
            </div>
            <StarRatingDisplay rating={overallRating} />
          </div>
          <p className="mt-3 text-[13px] text-[#6c6684]">
            Based on {totalRatings} submitted rating{totalRatings === 1 ? "" : "s"}
          </p>
        </div>

        <div>
          <p className="mb-3 text-[14px] font-bold text-[#24135f]">Rating Breakdown</p>
          <RatingBreakdownList breakdown={breakdown} />
        </div>
      </div>
    </section>
  );
}
