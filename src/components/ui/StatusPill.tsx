import Badge, { BadgeTone } from "./Badge";

const STATUS_MAP: Record<string, { label: string; tone: BadgeTone }> = {
  // Reels (migration 028 + Phase 4 stages)
  idea: { label: "Idea", tone: "neutral" },
  script_sent: { label: "Script Sent", tone: "info" },
  script_approved: { label: "Script Approved", tone: "success" },
  changes_requested: { label: "Changes Requested", tone: "warning" },
  approved: { label: "Approved", tone: "success" },
  shot: { label: "Shot", tone: "indigo" },
  editing: { label: "Editing", tone: "indigo" },
  edited: { label: "Edited", tone: "indigo" },
  edit_sent: { label: "Edit Sent", tone: "info" },
  edit_approved: { label: "Edit Approved", tone: "success" },
  posted: { label: "Posted", tone: "success" },
  // Tasks
  todo: { label: "To Do", tone: "neutral" },
  in_progress: { label: "In Progress", tone: "indigo" },
  review: { label: "In Review", tone: "warning" },
  done: { label: "Done", tone: "success" },
  // Generic
  active: { label: "Active", tone: "success" },
  overdue: { label: "Overdue", tone: "danger" },
  pending: { label: "Pending", tone: "warning" },
};

interface StatusPillProps {
  status: string;
  overrides?: Record<string, { label: string; tone: BadgeTone }>;
  className?: string;
}

export default function StatusPill({ status, overrides, className }: StatusPillProps) {
  const entry = overrides?.[status] || STATUS_MAP[status] || {
    label: status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    tone: "neutral" as BadgeTone,
  };
  return (
    <Badge tone={entry.tone} className={className}>
      {entry.label}
    </Badge>
  );
}
