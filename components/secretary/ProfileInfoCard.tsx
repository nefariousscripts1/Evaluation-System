import { UserRound } from "lucide-react";

type Props = {
  name: string;
  label: string;
};

export default function ProfileInfoCard({ name, label }: Props) {
  return (
    <div className="flex items-center gap-4 rounded-[8px] border border-[#e3dfef] bg-white px-5 py-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#efe6ff] text-[#6f53b8]">
        <UserRound size={28} />
      </div>

      <div>
        <p className="text-[14px] font-bold text-[#24135f]">{name}</p>
        <p className="text-[12px] text-[#6c6684]">{label}</p>
      </div>
    </div>
  );
}
