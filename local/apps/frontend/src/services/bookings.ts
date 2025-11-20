import { apiFetch } from "@/lib/api-client";
import type { BookingSummary } from "@/lib/types";

export type CreateBookingPayload = {
  slotId: string;
  lockToken: string;
  userId: string;
  timezone?: string;
  notes?: string;
};

export async function createBooking(payload: CreateBookingPayload, token?: string): Promise<BookingSummary> {
  // Always call the real API to create Google Calendar events with real Meet links
  // The backend will handle creating the calendar event and generating the Meet link
  if (!token) {
    throw new Error("Authentication token is required to create a booking");
  }
  
  return apiFetch<BookingSummary>(`/bookings`, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function fetchBooking(bookingId: string, token?: string) {
  return apiFetch<BookingSummary>(`/bookings/${bookingId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

export async function fetchBookingsByInstructor(instructorId: string, token: string) {
  return apiFetch<BookingSummary[]>(`/bookings/instructor/${instructorId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function fetchBookingsByUser(userId: string, token: string): Promise<BookingSummary[]> {
  // Always call the real API to get bookings from the database
  return apiFetch<BookingSummary[]>(`/bookings/user/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

