"use client";

import { useParams } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { AuthGuard } from "@/components/auth/auth-guard";
import { useAuthState } from "@/hooks/use-auth";
import { useInstructor } from "@/hooks/use-instructors";
import { useBookingsByInstructor } from "@/hooks/use-booking";
import { BookingsList } from "@/components/bookings/bookings-list";

export default function InstructorBookingsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { token } = useAuthState();

  const { data: instructor } = useInstructor(slug);
  const { data: bookings, isLoading } = useBookingsByInstructor(
    instructor?.id || null,
    token || null
  );

  return (
    <AuthGuard>
      <PageShell className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-base-foreground">
            Bookings for {instructor?.displayName || "Instructor"}
          </h1>
          <p className="text-sm text-muted-foreground">
            View all bookings and meeting links for this instructor.
          </p>
        </div>
        {isLoading ? (
          <div className="rounded-3xl border border-muted/70 bg-white/80 p-8 text-sm text-muted-foreground">
            Loading bookings...
          </div>
        ) : bookings && bookings.length > 0 ? (
          <BookingsList bookings={bookings} showStudent />
        ) : (
          <div className="rounded-3xl border border-muted/70 bg-white/80 p-8 text-sm text-muted-foreground">
            No bookings found for this instructor.
          </div>
        )}
      </PageShell>
    </AuthGuard>
  );
}

