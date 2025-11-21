"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAdminOverview,
  fetchAdminInstructors,
  updateAdminInstructor,
  fetchAdminBookings,
  manualRefundBooking,
} from "@/services/admin";
import type { UpdateInstructorAdminDto } from "@/types/dto";

export function useAdminOverview(token: string | null) {
  return useQuery({
    queryKey: ["admin", "overview"],
    queryFn: () => fetchAdminOverview(token!),
    enabled: Boolean(token),
    staleTime: 1000 * 30,
  });
}

export function useAdminInstructors(token: string | null) {
  return useQuery({
    queryKey: ["admin", "instructors"],
    queryFn: () => fetchAdminInstructors(token!),
    enabled: Boolean(token),
    staleTime: 1000 * 30,
  });
}

export function useUpdateInstructor(token: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateInstructorAdminDto }) =>
      updateAdminInstructor(token!, id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "instructors"] });
    },
  });
}

export function useAdminBookings(token: string | null) {
  return useQuery({
    queryKey: ["admin", "bookings"],
    queryFn: () => fetchAdminBookings(token!),
    enabled: Boolean(token),
    staleTime: 1000 * 15,
  });
}

export function useManualRefund(token: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, reason }: { bookingId: string; reason?: string }) =>
      manualRefundBooking(token!, bookingId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "bookings"] });
    },
  });
}

