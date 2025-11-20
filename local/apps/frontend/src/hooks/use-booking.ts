"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { create } from "zustand";
import { lockSlot, releaseSlot } from "@/services/instructors";
import { createBooking, fetchBookingsByInstructor, fetchBookingsByUser } from "@/services/bookings";
import { useAuthState } from "@/hooks/use-auth";

type BookingState = {
  lockToken: string | null;
  slotId: string | null;
  selectedDate: string | null;
  selectedSlotId: string | null;
  paymentCompleted: boolean;
  setSelectedDate: (dateIso: string) => void;
  setSelectedSlot: (slotId: string | null) => void;
  setReservation: (slotId: string, token: string) => void;
  clearReservation: () => void;
  setPaymentCompleted: (completed: boolean) => void;
};

export const useBookingState = create<BookingState>((set) => ({
  lockToken: null,
  slotId: null,
  selectedDate: null,
  selectedSlotId: null,
  paymentCompleted: false,
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  setSelectedSlot: (selectedSlotId) => set({ selectedSlotId }),
  setReservation: (slotId, lockToken) =>
    set({ slotId, lockToken, selectedSlotId: slotId }),
  clearReservation: () => set({ slotId: null, lockToken: null, selectedSlotId: null, paymentCompleted: false }),
  setPaymentCompleted: (paymentCompleted) => set({ paymentCompleted }),
}));

export function useLockSlot() {
  const queryClient = useQueryClient();
  const setReservation = useBookingState((state) => state.setReservation);

  return useMutation({
    mutationFn: lockSlot,
    onSuccess: (data, variables) => {
      setReservation(variables.slotId, data.token);
      queryClient.invalidateQueries({ queryKey: ["availability"] });
    },
  });
}

export function useReleaseSlot() {
  const queryClient = useQueryClient();
  const clearReservation = useBookingState((state) => state.clearReservation);

  return useMutation({
    mutationFn: ({ slotId, token }: { slotId: string; token: string }) =>
      releaseSlot(slotId, token),
    onSuccess: () => {
      clearReservation();
      queryClient.invalidateQueries({ queryKey: ["availability"] });
    },
    onError: () => {
      clearReservation();
    },
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  const clearReservation = useBookingState((state) => state.clearReservation);
  const { token } = useAuthState();

  return useMutation({
    mutationFn: async (payload: Parameters<typeof createBooking>[0]) => {
      if (!token) {
        throw new Error("Authentication required. Please login.");
      }
      const booking = await createBooking(payload, token);
      
      // If meet link is not immediately available, poll for it (max 3 attempts)
      // This handles cases where Google Calendar API takes a moment to generate the link
      if (!booking.meetLink && booking.id) {
        let attempts = 0;
        const maxAttempts = 3;
        const pollInterval = 1000; // 1 second
        
        while (attempts < maxAttempts && !booking.meetLink) {
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          try {
            const { fetchBooking } = await import("@/services/bookings");
            const updatedBooking = await fetchBooking(booking.id, token);
            if (updatedBooking.meetLink) {
              booking.meetLink = updatedBooking.meetLink;
              break;
            }
          } catch (error) {
            console.warn("Failed to poll for meet link:", error);
          }
          attempts++;
        }
      }
      
      return booking;
    },
    onSuccess: () => {
      clearReservation();
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["availability"] });
    },
  });
}

export function useBookingsByInstructor(instructorId: string | null, token: string | null) {
  return useQuery({
    queryKey: ["bookings", "instructor", instructorId],
    queryFn: () => {
      if (!instructorId || !token) throw new Error("Missing instructor ID or token");
      return fetchBookingsByInstructor(instructorId, token);
    },
    enabled: !!instructorId && !!token,
  });
}

export function useBookingsByUser(userId: string | null, token: string | null) {
  return useQuery({
    queryKey: ["bookings", "user", userId],
    queryFn: () => {
      if (!userId || !token) throw new Error("Missing user ID or token");
      return fetchBookingsByUser(userId, token);
    },
    enabled: !!userId && !!token,
  });
}

