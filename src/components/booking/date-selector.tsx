"use client";

import { addDays, format, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";

type DateSelectorProps = {
  selected: string | null;
  onChange: (dateIso: string) => void;
  days?: number;
};

export function DateSelector({ selected, onChange, days = 7 }: DateSelectorProps) {
  const today = startOfDay(new Date());
  const options = Array.from({ length: days }, (_, index) => addDays(today, index));

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
      {options.map((option, index) => {
        const value = option.toISOString();
        const isActive = selected ? value === selected : option.getTime() === today.getTime();

        return (
          <button
            key={value}
            onClick={() => onChange(value)}
            className={cn(
              "min-w-[120px] rounded-xl border px-5 py-3 text-left text-sm transition-all duration-300 hover:scale-105 active:scale-95 animate-fade-in-up",
              isActive
                ? "border-primary bg-primary text-white shadow-lg scale-105"
                : "border-muted bg-white text-muted-foreground hover:border-primary/50 hover:text-primary hover:shadow-md",
            )}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <span className={cn(
              "block text-xs uppercase tracking-wide font-medium mb-1",
              isActive ? "text-white/80" : "text-muted-foreground"
            )}>
              {format(option, "EEE")}
            </span>
            <span className={cn(
              "block text-base font-bold",
              isActive ? "text-white" : "text-base-foreground"
            )}>
              {format(option, "MMM d")}
            </span>
          </button>
        );
      })}
    </div>
  );
}

