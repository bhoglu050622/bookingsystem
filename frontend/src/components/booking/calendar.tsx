"use client";

import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfDay, isPast, isToday } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type CalendarProps = {
  selected?: Date | null;
  onSelect: (date: Date) => void;
  availableDates?: Date[];
  bookedDates?: Date[];
  minDate?: Date;
  maxDate?: Date;
};

export function Calendar({
  selected,
  onSelect,
  availableDates = [],
  bookedDates = [],
  minDate,
  maxDate,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Add days from previous month to fill the first week
  const firstDayOfWeek = monthStart.getDay();
  const previousMonthDays = Array.from({ length: firstDayOfWeek }, (_, i) => {
    const date = new Date(monthStart);
    date.setDate(date.getDate() - firstDayOfWeek + i);
    return date;
  });

  const allDays = [...previousMonthDays, ...daysInMonth];

  const isDateAvailable = (date: Date) => {
    const dateStart = startOfDay(date);
    if (minDate && dateStart < startOfDay(minDate)) return false;
    if (maxDate && dateStart > startOfDay(maxDate)) return false;
    if (isPast(dateStart) && !isToday(dateStart)) return false;
    
    if (availableDates.length > 0) {
      return availableDates.some((d) => isSameDay(d, date));
    }
    return true;
  };

  const isDateBooked = (date: Date) => {
    return bookedDates.some((d) => isSameDay(d, date));
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  return (
    <div className="rounded-xl border border-muted/50 bg-white p-6 shadow-sm">
      {/* Calendar Header */}
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-base-foreground">
          {format(currentMonth, "MMMM yyyy")}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={handlePreviousMonth}
            className="h-8 w-8 rounded-lg hover:bg-primary-muted flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={handleNextMonth}
            className="h-8 w-8 rounded-lg hover:bg-primary-muted flex items-center justify-center transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Day names */}
      <div className="mb-4 grid grid-cols-7 gap-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {allDays.map((date, index) => {
          const isCurrentMonth = isSameMonth(date, currentMonth);
          const isSelected = selected && isSameDay(date, selected);
          const isAvailable = isDateAvailable(date);
          const isBooked = isDateBooked(date);
          const isDisabled = !isCurrentMonth || !isAvailable || isBooked;

          return (
            <button
              key={date.toISOString()}
              onClick={() => !isDisabled && onSelect(date)}
              disabled={isDisabled}
              className={cn(
                "h-10 rounded-lg text-sm font-medium transition-all duration-200",
                "hover:scale-105 active:scale-95",
                !isCurrentMonth && "text-muted-foreground/30",
                isCurrentMonth && !isDisabled && "hover:bg-primary-muted hover:text-primary",
                isSelected && "bg-primary text-white shadow-md scale-105",
                isBooked && "bg-muted text-muted-foreground cursor-not-allowed opacity-50",
                isDisabled && !isBooked && "cursor-not-allowed opacity-30",
                isToday(date) && !isSelected && "ring-2 ring-primary/30",
              )}
            >
              {format(date, "d")}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-primary" />
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-muted" />
          <span>Booked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded border-2 border-primary" />
          <span>Available</span>
        </div>
      </div>
    </div>
  );
}

