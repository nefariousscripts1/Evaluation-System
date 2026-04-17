type RatingBreakdown = {
  fiveStar: number;
  fourStar: number;
  threeStar: number;
  twoStar: number;
  oneStar: number;
};

type Props = {
  breakdown: RatingBreakdown;
};

const breakdownRows: Array<{ label: string; key: keyof RatingBreakdown }> = [
  { label: "5 stars", key: "fiveStar" },
  { label: "4 stars", key: "fourStar" },
  { label: "3 stars", key: "threeStar" },
  { label: "2 stars", key: "twoStar" },
  { label: "1 star", key: "oneStar" },
];

export default function RatingBreakdownList({ breakdown }: Props) {
  return (
    <div className="space-y-3 rounded-[18px] border border-[#e8e4f3] bg-white p-4 shadow-[0_10px_26px_rgba(36,19,95,0.05)]">
      {breakdownRows.map((row) => (
        <div key={row.key} className="flex items-center justify-between text-[14px]">
          <span className="font-semibold text-[#3f3562]">{row.label}</span>
          <span className="font-bold text-[#24135f]">{breakdown[row.key]}</span>
        </div>
      ))}
    </div>
  );
}
