"use client";

import evaluationLogo from "@/public/evaluationlogo.png";

type AppLogoProps = {
  className?: string;
};

export default function AppLogo({ className = "" }: AppLogoProps) {
  return (
    <img
      src={evaluationLogo.src}
      alt="Digital Evaluation System logo"
      width={evaluationLogo.width}
      height={evaluationLogo.height}
      className={className}
      loading="eager"
      decoding="async"
    />
  );
}
