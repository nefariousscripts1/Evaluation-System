"use client";

import Image from "next/image";
import evaluationLogo from "@/public/evaluationlogo.png";

type AppLogoProps = {
  className?: string;
};

export default function AppLogo({ className = "" }: AppLogoProps) {
  return (
    <Image
      src={evaluationLogo}
      alt="Digital Evaluation System logo"
      className={className}
      priority
    />
  );
}
