import { apiFetch } from "@/lib/api-client";
import type { AvailabilitySlot, DailyAvailability, InstructorProfile } from "@/lib/types";
import { HARDCODED_INSTRUCTORS } from "@/data/hardcoded-instructors";

export async function fetchInstructors(useScraped: boolean = true): Promise<InstructorProfile[]> {
  // Return hardcoded instructors directly (no API call)
  return Promise.resolve(HARDCODED_INSTRUCTORS);
}

export async function fetchInstructor(slug: string, useScraped: boolean = true): Promise<InstructorProfile> {
  // Use API client to ensure mock API works correctly for e2e testing
  return apiFetch<InstructorProfile>(`/instructors/${slug}`);
}

const rawMockFlag = process.env.NEXT_PUBLIC_USE_MOCK_API;
const USE_MOCK_API =
  rawMockFlag === undefined ||
  rawMockFlag === "" ||
  rawMockFlag === "true" ||
  rawMockFlag === "1";

export async function fetchDailyAvailability(
  instructorId: string,
  dateIso: string,
): Promise<DailyAvailability> {
  const param = USE_MOCK_API ? "date" : "targetDate";
  return apiFetch<DailyAvailability>(
    `/availability/instructor/${instructorId}?${param}=${dateIso}`,
    { tags: [`availability:${instructorId}`] },
  );
}

export type LockSlotPayload = {
  slotId: string;
  userId?: string;
  reason?: string;
};

export async function lockSlot(payload: LockSlotPayload) {
  // Always call the real API to lock real slots from the database
  return apiFetch<{ slotId: string; token: string; lockedUntil: string }>(
    `/availability/lock`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export async function releaseSlot(slotId: string, token: string) {
  // Always call the real API to release real slots
  return apiFetch<{ released: boolean }>(`/availability/release`, {
    method: "POST",
    body: JSON.stringify({ slotId, token }),
  });
}

export function groupSlotsByDay(slots: AvailabilitySlot[]) {
  return slots.reduce<Record<string, AvailabilitySlot[]>>((acc, slot) => {
    const day = slot.startTimeLocal.split(",")[0] ?? slot.startTimeLocal;
    acc[day] = acc[day] ? [...acc[day], slot] : [slot];
    return acc;
  }, {});
}
