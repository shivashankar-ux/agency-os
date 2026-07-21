"use client";

import React, { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";

interface DatePickerProps {
  value?: string; // Format: "YYYY-MM-DD" or ISO string
  onChange?: (dateString: string) => void;
  name?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export default function DatePicker({
  value = "",
  onChange,
  name,
  placeholder = "Select date...",
  required = false,
  disabled = false,
  className = "",
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    if (!value) return null;
    const parsed = parseISO(value.includes("T") ? value.split("T")[0] : value);
    return isNaN(parsed.getTime()) ? null : parsed;
  });

  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    if (value) {
      const parsed = parseISO(value.includes("T") ? value.split("T")[0] : value);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal state when external value prop changes
  useEffect(() => {
    if (value) {
      const parsed = parseISO(value.includes("T") ? value.split("T")[0] : value);
      if (!isNaN(parsed.getTime())) {
        setSelectedDate(parsed);
      }
    } else {
      setSelectedDate(null);
    }
  }, [value]);

  // Handle outside click to close dropdown calendar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const dateValueString = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";

  const handleSelectDay = (day: Date) => {
    setSelectedDate(day);
    const formatted = format(day, "yyyy-MM-dd");
    if (onChange) {
      onChange(formatted);
    }
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDate(null);
    if (onChange) onChange("");
  };

  // Calendar matrix calculation
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const currentYear = currentMonth.getFullYear();
  const currentMonthIdx = currentMonth.getMonth();

  // Create range of years for year selector
  const years = Array.from({ length: 20 }, (_, i) => currentYear - 10 + i);

  return (
    <div ref={containerRef} className="relative inline-block w-full">
      {/* Hidden input to support standard forms / FormData */}
      {name && <input type="hidden" name={name} value={dateValueString} required={required} />}

      {/* Input Display Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm transition-all focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 ${className}`}
      >
        <span className={selectedDate ? "text-white" : "text-neutral-500"}>
          {selectedDate ? format(selectedDate, "MMM dd, yyyy") : placeholder}
        </span>
        <div className="flex items-center gap-1.5 text-neutral-400">
          {selectedDate && (
            <span
              onClick={handleClear}
              className="text-xs text-neutral-500 hover:text-neutral-300 px-1 py-0.5 rounded hover:bg-neutral-800"
              title="Clear date"
            >
              ✕
            </span>
          )}
          <CalendarIcon size={16} className="text-neutral-400" />
        </div>
      </button>

      {/* Pop-up Calendar Dropdown */}
      {isOpen && (
        <div className="absolute left-0 z-50 mt-2 w-72 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-4 text-white animate-in fade-in zoom-in-95 duration-150">
          {/* Header Controls: Month & Year pickers + navigation */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1">
              <select
                value={currentMonthIdx}
                onChange={(e) => setCurrentMonth(new Date(currentYear, parseInt(e.target.value), 1))}
                className="bg-neutral-950 text-white text-xs font-semibold rounded-lg border border-neutral-800 px-2 py-1 focus:outline-none focus:border-indigo-500"
              >
                {monthNames.map((m, idx) => (
                  <option key={m} value={idx}>{m}</option>
                ))}
              </select>
              <select
                value={currentYear}
                onChange={(e) => setCurrentMonth(new Date(parseInt(e.target.value), currentMonthIdx, 1))}
                className="bg-neutral-950 text-white text-xs font-semibold rounded-lg border border-neutral-800 px-2 py-1 focus:outline-none focus:border-indigo-500"
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
                title="Previous Month"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
                title="Next Month"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-neutral-500 mb-2">
            <div>Su</div>
            <div>Mo</div>
            <div>Tu</div>
            <div>We</div>
            <div>Th</div>
            <div>Fr</div>
            <div>Sa</div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isToday = isSameDay(day, new Date());

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`h-8 w-8 text-xs rounded-xl flex items-center justify-center transition-all ${
                    isSelected
                      ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30"
                      : isToday
                      ? "border border-indigo-500 text-indigo-400 font-semibold"
                      : isCurrentMonth
                      ? "text-neutral-200 hover:bg-neutral-800"
                      : "text-neutral-600 hover:bg-neutral-850"
                  }`}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>

          {/* Quick Shortcuts */}
          <div className="mt-3 pt-3 border-t border-neutral-800 flex justify-between text-xs text-indigo-400 font-medium">
            <button
              type="button"
              onClick={() => handleSelectDay(new Date())}
              className="hover:underline"
            >
              Today
            </button>
            {selectedDate && (
              <button
                type="button"
                onClick={() => handleClear({ stopPropagation: () => {} } as any)}
                className="text-neutral-500 hover:text-neutral-300"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
