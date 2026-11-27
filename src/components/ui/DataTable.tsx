"use client";

import { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import EmptyState from "./EmptyState";
import { SkeletonRow } from "./Skeleton";

export interface DataTableColumn<T> {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
  // Server-driven pagination (wire these up when the page's data fetch is paginated)
  page?: number;
  pageSize?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
}

export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  emptyTitle = "Nothing here yet",
  emptyDescription,
  onRowClick,
  page,
  pageSize,
  totalCount,
  onPageChange,
}: DataTableProps<T>) {
  const showPagination = page !== undefined && pageSize !== undefined && totalCount !== undefined && onPageChange;
  const totalPages = showPagination ? Math.max(1, Math.ceil(totalCount! / pageSize!)) : 1;
  const rangeStart = showPagination ? (page! - 1) * pageSize! + 1 : null;
  const rangeEnd = showPagination ? Math.min(page! * pageSize!, totalCount!) : null;

  return (
    <div className="border border-neutral-800 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-800/60 text-neutral-400 text-xs font-semibold uppercase tracking-wide">
              {columns.map((col) => (
                <th key={col.key} className={`text-left px-3 py-2.5 ${col.className || ""}`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={columns.length}>
                    <SkeletonRow cols={columns.length} />
                  </td>
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={() => onRowClick?.(row)}
                  className={`border-t border-neutral-800 text-neutral-300 ${
                    onRowClick ? "cursor-pointer hover:bg-neutral-850" : ""
                  }`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={`px-3 py-3 ${col.className || ""}`}>
                      {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showPagination && (
        <div className="flex items-center justify-between px-3 py-2.5 border-t border-neutral-800 bg-neutral-900 text-xs text-neutral-500">
          <span>
            Showing {rangeStart}-{rangeEnd} of {totalCount}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange!(page! - 1)}
              disabled={page! <= 1}
              className="p-1.5 rounded-lg bg-neutral-800 disabled:opacity-40 hover:bg-neutral-700 text-neutral-300"
              aria-label="Previous page"
            >
              <ChevronLeft size={14} />
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => onPageChange!(page! + 1)}
              disabled={page! >= totalPages}
              className="p-1.5 rounded-lg bg-neutral-800 disabled:opacity-40 hover:bg-neutral-700 text-neutral-300"
              aria-label="Next page"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
