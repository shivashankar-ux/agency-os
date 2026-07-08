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
        <span className="text-neutral-500 text-xs font-bold tracking-wider uppercase">
          {label}
        </span>
        <div className="bg-indigo-650/10 border border-indigo-500/20 p-2.5 rounded-xl text-indigo-450 shadow-inner">
          {icon}
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <span className="text-white text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">
          {value}
        </span>

        {trend && (
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 shrink-0 ${
              trend.isPositive
                ? "bg-green-950/30 text-green-400 border-green-900/30"
                : "bg-red-950/30 text-red-400 border-red-900/30"
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
          className={`card-glass rounded-2xl p-5 hover:border-indigo-500/60 hover:bg-neutral-900/50 transition-all cursor-pointer shadow-sm hover:shadow-lg group-hover:scale-[1.02] neon-glow-hover ${className}`}
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
      className={`card-glass rounded-2xl p-5 hover:border-neutral-700/60 hover:bg-neutral-900/50 transition-colors shadow-sm neon-glow-hover ${className}`}
    >
      {CardContent}
    </motion.div>
  );
}
