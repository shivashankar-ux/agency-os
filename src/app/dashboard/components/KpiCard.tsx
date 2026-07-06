"use client";

import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
}

export default function KpiCard({
  label,
  value,
  icon: Icon,
  trend,
  className = "",
}: KpiCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-neutral-900 border border-neutral-800 rounded-xl p-5 hover:border-neutral-700 transition-colors shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-neutral-500 text-xs font-medium tracking-wide uppercase">
          {label}
        </span>
        <div className="bg-neutral-800/80 p-2 rounded-lg text-neutral-400">
          <Icon size={18} />
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <span className="text-white text-3xl font-semibold tracking-tight">
          {value}
        </span>

        {trend && (
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
              trend.isPositive
                ? "bg-green-950/40 text-green-400 border-green-900/50"
                : "bg-red-950/40 text-red-400 border-red-900/50"
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>
    </motion.div>
  );
}
