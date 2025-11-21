"use client";

import { useEffect, useMemo, useState } from "react";
import { startOfDay, parseISO } from "date-fns";
import { useRouter } from "next/navigation";
import { DateSelector } from "@/components/booking/date-selector";
import { Calendar } from "@/components/booking/calendar";
import { SlotList } from "@/components/booking/slot-list";
import { BookingSummary } from "@/components/booking/booking-summary";
import { PaymentStep } from "@/components/booking/payment-step";
import { BookingRedirectAnimation } from "@/components/booking/booking-redirect-animation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { InstructorProfile, AvailabilitySlot, DailyAvailability } from "@/lib/types";
import { useDailyAvailability } from "@/hooks/use-instructors";
import { useAuthState } from "@/hooks/use-auth";
import {
  useBookingState,
  useLockSlot,
  useReleaseSlot,
  useCreateBooking,
} from "@/hooks/use-booking";

type BookingExperienceProps = {
  instructor: InstructorProfile;
};

export function BookingExperience({ instructor }: BookingExperienceProps) {
  const router = useRouter();
  const { user, token } = useAuthState();
  const [showCalendar, setShowCalendar] = useState(false);
  const [showRedirectAnimation, setShowRedirectAnimation] = useState(false);
  
  const selectedDate = useBookingState((state) => state.selectedDate);
  const setSelectedDate = useBookingState((state) => state.setSelectedDate);
  const selectedSlotId = useBookingState((state) => state.selectedSlotId);
  const setSelectedSlot = useBookingState((state) => state.setSelectedSlot);
  const lockToken = useBookingState((state) => state.lockToken);
  const lockedSlotId = useBookingState((state) => state.slotId);
  const paymentCompleted = useBookingState((state) => state.paymentCompleted);
  const setPaymentCompleted = useBookingState((state) => state.setPaymentCompleted);

  const lockMutation = useLockSlot();
  const releaseMutation = useReleaseSlot();
  const bookingMutation = useCreateBooking();

  const defaultDateIso = useMemo(
    () => startOfDay(new Date()).toISOString(),
    [],
  );

  useEffect(() => {
    if (!selectedDate) {
      setSelectedDate(defaultDateIso);
    }
  }, [defaultDateIso, selectedDate, setSelectedDate]);

  const activeDate = selectedDate ?? defaultDateIso;

  const { data, isLoading, error } = useDailyAvailability(instructor.id, activeDate);
  const availability = data as unknown as DailyAvailability | undefined;
  
  // Log for debugging
  useEffect(() => {
    if (error) {
      console.error("Availability fetch error:", error);
    }
    if (availability) {
      console.log("Availability data:", { instructorId: instructor.id, date: activeDate, slotsCount: availability.slots?.length ?? 0 });
    }
  }, [error, availability, instructor.id, activeDate]);

  // Calculate available dates from slots (for calendar display)
  const availableDates = useMemo(() => {
    if (!availability?.slots) return [];
    const dates = new Set<string>();
    availability.slots.forEach((slot) => {
      if (slot.status === "AVAILABLE" && !slot.isLocked) {
        const slotDate = parseISO(slot.startTimeUtc);
        dates.add(startOfDay(slotDate).toISOString());
      }
    });
    return Array.from(dates).map((iso) => parseISO(iso));
  }, [availability?.slots]);

  const handleCalendarDateSelect = (date: Date) => {
    setSelectedDate(startOfDay(date).toISOString());
  };

  const selectedDateObj = selectedDate ? parseISO(selectedDate) : null;

  const selectedSlot = useMemo(() => {
    return availability?.slots.find((slot) => slot.id === selectedSlotId) ?? null;
  }, [availability?.slots, selectedSlotId]);

  const handleSlotSelect = (slot: AvailabilitySlot) => {
    if (slot.id === selectedSlotId) return;

    if (lockToken && lockedSlotId && lockedSlotId !== slot.id) {
      releaseMutation.mutate({ slotId: lockedSlotId, token: lockToken });
    }

    setSelectedSlot(slot.id);
    lockMutation.mutate({ slotId: slot.id });
  };

  const handlePaymentSuccess = () => {
    setPaymentCompleted(true);
  };

  const handleReserve = () => {
    if (!selectedSlotId || !lockToken) return;
    
    if (!user?.id) {
      // Redirect to login if not authenticated (client-side navigation, not API call)
      router.push("/auth/login");
      return;
    }
    
    if (!token) {
      console.error("No authentication token available");
      router.push("/auth/login");
      return;
    }
    
    bookingMutation.mutate(
      {
        slotId: selectedSlotId,
        lockToken,
        userId: user.id,
      },
      {
        onSuccess: async () => {
          // Show redirection animation
          setShowRedirectAnimation(true);
        },
        onError: (error) => {
          console.error("Booking failed:", error);
          // If unauthorized, redirect to login
          if (error instanceof Error && error.message.includes("Unauthorized")) {
            router.push("/auth/login");
          }
        },
      }
    );
  };

  useEffect(() => {
    return () => {
      if (lockToken && lockedSlotId) {
        releaseMutation.mutate({ slotId: lockedSlotId, token: lockToken });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show redirect animation if booking is successful
  if (showRedirectAnimation) {
    return <BookingRedirectAnimation />;
  }

  // Show payment step first if payment is not completed
  if (!paymentCompleted) {
    // Check if user is logged in before showing payment
    if (!user?.id || !token) {
      return (
        <div className="max-w-2xl mx-auto">
          <div className="rounded-xl border border-muted/50 bg-white p-8 shadow-sm text-center">
            <h2 className="text-2xl font-semibold text-base-foreground mb-4">Login Required</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Please login to book a session with {instructor.displayName}.
            </p>
            <Button
              variant="primary"
              onClick={() => router.push("/auth/login")}
              className="w-full"
            >
              Go to Login
            </Button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="max-w-2xl mx-auto">
        <PaymentStep instructor={instructor} onPaymentSuccess={handlePaymentSuccess} />
      </div>
    );
  }

  // Show slot selection after payment is completed
  return (
    <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-base-foreground">Pick a date</h2>
            <Button
              variant="ghost"
              onClick={() => setShowCalendar(!showCalendar)}
              className="text-sm text-muted-foreground hover:text-primary"
            >
              {showCalendar ? "Show quick dates" : "Show calendar"}
            </Button>
          </div>
          {showCalendar ? (
            <Calendar
              selected={selectedDateObj}
              onSelect={handleCalendarDateSelect}
              availableDates={availableDates}
              minDate={startOfDay(new Date())}
            />
          ) : (
            <DateSelector selected={activeDate} onChange={setSelectedDate} />
          )}
        </div>
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-base-foreground">
            Available slots {selectedDateObj && `for ${selectedDateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`}
          </h2>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 rounded-2xl" />
              <Skeleton className="h-12 rounded-2xl" />
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-dashed border-muted/80 bg-white/70 p-6 text-sm text-muted-foreground">
              <p className="font-medium text-base-foreground mb-1">Unable to load availability</p>
              <p className="text-xs">The instructor may not have availability slots configured. Please contact support.</p>
              {process.env.NODE_ENV === 'development' && (
                <p className="text-xs mt-2 text-red-600">Error: {(error as Error)?.message || 'Unknown error'}</p>
              )}
            </div>
          ) : (
            <SlotList
              slots={availability?.slots ?? []}
              selectedSlotId={selectedSlotId}
              onSelect={handleSlotSelect}
              isLoading={isLoading}
            />
          )}
        </div>
      </div>
      <div className="space-y-4">
        <BookingSummary
          instructor={instructor}
          slot={selectedSlot ?? undefined}
          paymentCompleted={paymentCompleted}
          amountPaid={instructor.pricingAmount}
          currency={instructor.pricingCurrency}
        />
        <Button
          variant="primary"
          onClick={handleReserve}
          disabled={
            !selectedSlotId || 
            !lockToken || 
            !user?.id || 
            lockMutation.isPending || 
            bookingMutation.isPending
          }
          className="w-full"
        >
          {bookingMutation.isPending 
            ? "Reserving slot…" 
            : !user?.id 
              ? "Login to Reserve" 
              : "Reserve this time"}
        </Button>
        {bookingMutation.isError && (
          <p className="text-xs text-red-600">
            {(bookingMutation.error as Error)?.message || "Failed to reserve slot. Please try again."}
          </p>
        )}
        {lockMutation.isError && (
          <p className="text-xs text-red-600">
            Failed to lock slot. Please try selecting again.
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          {user?.id 
            ? "You'll be redirected to your dashboard once the slot is reserved."
            : "Please login to reserve a time slot."}
        </p>
      </div>
    </div>
  );
}
