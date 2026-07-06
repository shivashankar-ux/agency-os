"use client";

import { motion } from "framer-motion";
import { MessageSquare, CheckSquare, Clock } from "lucide-react";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user?: { name: string; role: string } | null;
}

interface ActivityTabProps {
  comments: Comment[];
}

function timeAgo(isoString: string): string {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const roleColors: Record<string, string> = {
  owner: "bg-violet-600",
  manager: "bg-indigo-600",
  member: "bg-neutral-600",
};

export default function ActivityTab({ comments }: ActivityTabProps) {
  return (
    <div className="space-y-4">
      <p className="text-neutral-400 text-xs font-semibold uppercase tracking-wider">
        {comments.length} Comment{comments.length !== 1 ? "s" : ""}
      </p>

      {comments.length === 0 ? (
        <div className="py-10 text-center border border-dashed border-neutral-800 rounded-xl">
          <MessageSquare size={24} className="text-neutral-700 mx-auto mb-3" />
          <p className="text-neutral-500 text-xs italic">No comments yet on this project's tasks.</p>
          <p className="text-neutral-600 text-xxs mt-1">Comments made on tasks inside this project will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((c, index) => {
            const name = c.user?.name || "Team Member";
            const role = c.user?.role || "member";
            const avatarColor = roleColors[role] || "bg-neutral-600";

            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex items-start gap-3"
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full ${avatarColor} flex items-center justify-center text-white text-xxs font-bold shrink-0`}>
                  {getInitials(name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-xs font-semibold">{name}</span>
                      <span className="text-neutral-500 text-xxs capitalize">{role}</span>
                    </div>
                    <span className="text-neutral-600 text-xxs whitespace-nowrap flex items-center gap-1">
                      <Clock size={10} /> {timeAgo(c.created_at)}
                    </span>
                  </div>
                  <p className="text-neutral-300 text-xs leading-relaxed">{c.content}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
