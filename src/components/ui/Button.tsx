"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "accent" | "danger" | "secondary" | "ghost";
type Size = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-indigo-600 hover:bg-indigo-500 text-white-literal",
  accent: "bg-amber-600 hover:bg-amber-500 text-neutral-950",
  danger: "bg-red-900/40 hover:bg-red-900/60 text-red-400 border border-red-900",
  secondary: "bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700",
  ghost: "bg-transparent hover:bg-neutral-850 text-neutral-400 hover:text-white",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  disabled,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    >
      {loading ? <Loader2 size={size === "sm" ? 14 : 16} className="animate-spin" /> : icon}
      {children}
    </button>
  );
}
