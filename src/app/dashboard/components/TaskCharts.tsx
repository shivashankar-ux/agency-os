"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

interface TaskChartsProps {
  taskStatus: {
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
  };
  taskPriority: {
    low: number;
    medium: number;
    high: number;
  };
}

export default function TaskCharts({ taskStatus, taskPriority }: TaskChartsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Status Chart Data
  const statusData = [
    { name: "Pending", value: taskStatus.pending, color: "#a855f7" }, // Purple
    { name: "In Progress", value: taskStatus.inProgress, color: "#6366f1" }, // Indigo
    { name: "Completed", value: taskStatus.completed, color: "#10b981" }, // Emerald
    { name: "Overdue", value: taskStatus.overdue, color: "#ef4444" }, // Red
  ].filter(d => d.value > 0);

  // Priority Chart Data
  const priorityData = [
    { name: "Low", count: taskPriority.low, color: "#6b7280" },
    { name: "Medium", count: taskPriority.medium, color: "#3b82f6" },
    { name: "High", count: taskPriority.high, color: "#ef4444" },
  ];

  // Custom tooltips for dark theme
  const renderTooltip = (props: any) => {
    const { active, payload } = props;
    if (active && payload && payload.length) {
      return (
        <div className="bg-neutral-950 border border-neutral-800 p-2.5 rounded-lg text-xxs font-semibold shadow-lg">
          <p className="text-white capitalize">{`${payload[0].name}: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  // If component is server rendered, show clean skeletons to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 h-72 animate-pulse flex items-center justify-center">
          <span className="text-neutral-600 text-xs font-semibold">Loading charts...</span>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 h-72 animate-pulse flex items-center justify-center">
          <span className="text-neutral-600 text-xs font-semibold">Loading charts...</span>
        </div>
      </div>
    );
  }

  const hasStatusData = statusData.length > 0;
  const hasPriorityData = priorityData.some(d => d.count > 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {/* 1. Tasks by Status (Pie Chart) */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-sm flex flex-col">
        <h3 className="text-white text-sm font-semibold mb-4 tracking-wide uppercase">
          Tasks by Status
        </h3>

        <div className="flex-1 min-h-[190px] flex items-center justify-center">
          {hasStatusData ? (
            <div className="w-full flex items-center justify-around flex-col sm:flex-row gap-4">
              <div className="w-36 h-36 relative flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={renderTooltip} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legends */}
              <div className="flex flex-col gap-2">
                {statusData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2.5 text-xs">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: d.color }}
                    />
                    <span className="text-neutral-400 font-medium">{d.name}</span>
                    <span className="text-white font-semibold ml-auto">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-neutral-500 text-xs italic">No active task metrics recorded.</p>
          )}
        </div>
      </div>

      {/* 2. Tasks by Priority (Bar Chart) */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-sm flex flex-col">
        <h3 className="text-white text-sm font-semibold mb-4 tracking-wide uppercase">
          Tasks by Priority
        </h3>

        <div className="flex-1 min-h-[190px] flex items-center justify-center">
          {hasPriorityData ? (
            <div className="w-full h-full min-h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis
                    dataKey="name"
                    stroke="#525252"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#525252"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={renderTooltip} cursor={{ fill: "#171717", opacity: 0.3 }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-neutral-500 text-xs italic">No active task metrics recorded.</p>
          )}
        </div>
      </div>
    </div>
  );
}
