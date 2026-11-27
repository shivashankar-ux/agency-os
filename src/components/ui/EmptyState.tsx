import { ReactNode } from "react";
import { LucideIcon, Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon: Icon = Inbox, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center mb-3">
        <Icon size={20} className="text-neutral-500" />
      </div>
      <p className="text-neutral-300 font-semibold text-sm">{title}</p>
      {description && <p className="text-neutral-500 text-xs mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
