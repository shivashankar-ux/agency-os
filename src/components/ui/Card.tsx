import { HTMLAttributes, ReactNode } from "react";

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
  action?: ReactNode;
  padded?: boolean;
}

export default function Card({ title, action, padded = true, className = "", children, ...rest }: CardProps) {
  return (
    <div
      className={`bg-neutral-900 border border-neutral-800 rounded-2xl ${padded ? "p-5" : ""} ${className}`}
      {...rest}
    >
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && <h3 className="text-white font-bold text-sm">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
