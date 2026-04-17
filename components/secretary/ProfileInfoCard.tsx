import { UserRound } from "lucide-react";

type Props = {
  name: string;
  label: string;
};

export default function ProfileInfoCard({ name, label }: Props) {
  return (
    <div className="flex flex-col items-start gap-4 rounded-[20px] border border-[#e3dfef] bg-white px-5 py-5 shadow-[0_12px_30px_rgba(36,19,95,0.06)] sm:flex-row sm:items-center sm:px-6">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#efe6ff] text-[#6f53b8] shadow-[0_10px_24px_rgba(111,83,184,0.16)]">
        <UserRound size={28} />
      </div>

      <div className="min-w-0">
        <p className="break-words text-[15px] font-bold text-[#24135f]">{name}</p>
        <p className="mt-1 text-[12px] text-[#6c6684]">{label}</p>
      </div>
    </div>
  );
}
