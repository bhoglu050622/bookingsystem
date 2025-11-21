import { apiFetch } from "@/lib/api-client";
import type {
  AdminBooking,
  AdminInstructor,
  AdminOverview,
} from "@/lib/types";
import type { UpdateInstructorAdminDto } from "@/types/dto";

export async function fetchAdminOverview(token: string) {
  return apiFetch<AdminOverview>("/admin/overview", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function fetchAdminInstructors(token: string) {
  return apiFetch<AdminInstructor[]>("/admin/instructors", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function updateAdminInstructor(
  token: string,
  id: string,
  payload: UpdateInstructorAdminDto,
) {
  return apiFetch<AdminInstructor>(`/admin/instructors/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function fetchAdminBookings(token: string) {
  return apiFetch<AdminBooking[]>("/admin/bookings", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function manualRefundBooking(
  token: string,
  bookingId: string,
  reason?: string,
) {
  return apiFetch<AdminBooking>(`/admin/bookings/${bookingId}/refund`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ reason }),
  });
}

