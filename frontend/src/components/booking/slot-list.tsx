"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { AvailabilitySlot } from "@/lib/types";

type SlotListProps = {
  slots: AvailabilitySlot[];
  selectedSlotId: string | null;
  onSelect: (slot: AvailabilitySlot) => void;
  isLoading?: boolean;
};

export function SlotList({ slots, selectedSlotId, onSelect, isLoading }: SlotListProps) {
  const availableSlots = useMemo(
    () => slots.filter((slot) => slot.status === "AVAILABLE" && !slot.isLocked),
    [slots],
  );

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading availability…</div>;
  }

  if (availableSlots.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-muted/80 bg-white/70 p-6 text-sm text-muted-foreground">
        No open slots for this day. Try another date.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {availableSlots.map((slot, index) => {
        const isSelected = slot.id === selectedSlotId;
        return (
          <button
            key={slot.id}
            className={cn(
              "rounded-lg border-2 px-4 py-3 text-left text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] animate-fade-in-up",
              isSelected
                ? "border-primary bg-primary text-white shadow-md"
                : "border-muted-dark bg-white text-base-foreground hover:border-primary hover:bg-primary-muted/30 hover:text-primary",
            )}
            style={{ animationDelay: `${index * 0.03}s` }}
            onClick={() => onSelect(slot)}
          >
            <span className="block font-semibold text-base">{slot.startTimeLocal}</span>
            <span className={cn(
              "text-xs mt-0.5",
              isSelected ? "text-white/90" : "text-muted-foreground"
            )}>{slot.endTimeLocal}</span>
          </button>
        );
      })}
    </div>
  );
}
