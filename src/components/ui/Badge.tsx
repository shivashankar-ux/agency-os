import { ReactNode } from "react";

export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info" | "indigo" | "amber";

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: "bg-neutral-800 text-neutral-400 border-neutral-700",
  success: "bg-emerald-950/40 text-emerald-400 border-emerald-900/50",
  warning: "bg-yellow-950/30 text-yellow-400 border-yellow-900/60",
  danger: "bg-red-950/40 text-red-400 border-red-900/50",
  info: "bg-sky-950/40 text-sky-400 border-sky-900/50",
  indigo: "bg-indigo-950/40 text-indigo-400 border-indigo-900/50",
  amber: "bg-amber-950/40 text-amber-400 border-amber-900/50",
};

export default function Badge({ tone = "neutral", children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] sm:text-xxs px-2.5 py-1 rounded-full border font-semibold tracking-wider uppercase ${TONE_CLASSES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
