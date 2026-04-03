import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export default function Card({ children, className = "" }: CardProps) {
  return <div className={`rounded-lg bg-white shadow ${className}`}>{children}</div>;
}