"use client";

import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
  href?: string;
}

export default function KpiCard({
  label,
  value,
  icon,
  trend,
  className = "",
  href,
}: KpiCardProps) {
  const CardContent = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-neutral-500 text-xs font-medium tracking-wide uppercase">
          {label}
        </span>
        <div className="bg-neutral-800/80 p-2 rounded-lg text-neutral-400">
          {icon}
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <span className="text-white text-3xl font-semibold tracking-tight">
          {value}
        </span>

        {trend && (
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 shrink-0 ${
              trend.isPositive
                ? "bg-green-950/40 text-green-400 border-green-900/50"
                : "bg-red-950/40 text-red-400 border-red-900/50"
            }`}
          >
            {trend.value.startsWith("+") && <span className="text-[9px]">▲</span>}
            {trend.value.startsWith("-") && <span className="text-[9px]">▼</span>}
            {trend.value}
          </span>
        )}
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} prefetch={false} className="block group">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`bg-neutral-900 border border-neutral-800 rounded-xl p-5 hover:border-indigo-500/50 hover:bg-neutral-850/50 transition-all cursor-pointer shadow-sm group-hover:shadow-md ${className}`}
        >
          {CardContent}
        </motion.div>
      </Link>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-neutral-900 border border-neutral-800 rounded-xl p-5 hover:border-neutral-700 transition-colors shadow-sm ${className}`}
    >
      {CardContent}
    </motion.div>
  );
}
