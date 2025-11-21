"use client";

import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import type { DailyAvailability } from "@/lib/types";
import {
  fetchDailyAvailability,
  fetchInstructor,
  fetchInstructors,
} from "@/services/instructors";

export function useInstructors() {
  return useQuery({
    queryKey: ["instructors"],
    queryFn: () => fetchInstructors(true), // Use scraped data by default
    staleTime: 1000 * 60 * 5,
  });
}

export function useInstructor(slug: string) {
  return useSuspenseQuery({
    queryKey: ["instructors", slug],
    queryFn: () => fetchInstructor(slug),
    staleTime: 1000 * 60 * 5,
  });
}

export function useDailyAvailability(instructorId: string, dateIso: string) {
  return useQuery<DailyAvailability, Error>({
    queryKey: ["availability", instructorId, dateIso],
    queryFn: () => fetchDailyAvailability(instructorId, dateIso),
    enabled: Boolean(instructorId && dateIso),
    staleTime: 1000 * 30,
    retry: 1,
  });
}
