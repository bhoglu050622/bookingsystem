"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { AuthGuard } from "@/components/auth/auth-guard";
import { useAuthState } from "@/hooks/use-auth";
import { useBookingsByUser } from "@/hooks/use-booking";
import { BookingsList } from "@/components/bookings/bookings-list";
 

function DashboardPageInner() {
  const { user, token } = useAuthState();
  const searchParams = useSearchParams();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const { data: bookings, isLoading } = useBookingsByUser(user?.id || null, token || null);

  useEffect(() => {
    // Check if redirected from booking
    if (searchParams.get("booking") === "success") {
      setShowSuccessMessage(true);
      // Remove query param from URL without reload
      const url = new URL(window.location.href);
      url.searchParams.delete("booking");
      window.history.replaceState({}, "", url.toString());
      
      // Hide success message after 5 seconds
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
    
    // Check if Google OAuth was successful
    if (searchParams.get("google_connected") === "true") {
      // Show success message
      alert("Google Calendar connected successfully! You can now create bookings with real Meet links.");
      // Remove query param
      const url = new URL(window.location.href);
      url.searchParams.delete("google_connected");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams]);

  // Get the most recent booking to highlight
  const latestBooking = bookings && bookings.length > 0 
    ? bookings.sort((a, b) => new Date(b.scheduledStart).getTime() - new Date(a.scheduledStart).getTime())[0]
    : null;

  return (
    <AuthGuard>
      <PageShell className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-base-foreground mb-2">My Bookings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your upcoming sessions, reschedule, and join meetings.
          </p>
        </div>
        
        
        
        {showSuccessMessage && (
          <div className="rounded-xl border border-success/20 bg-success/5 p-4 flex items-start gap-3 animate-fade-in">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-success/10 flex items-center justify-center mt-0.5">
              <svg
                className="w-4 h-4 text-success"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-success mb-1">Booking Confirmed!</h3>
              <p className="text-sm text-muted-foreground">
                Your session has been successfully booked. {latestBooking?.meetLink && "You can join the meeting using the link below."}
              </p>
            </div>
            <button
              onClick={() => setShowSuccessMessage(false)}
              className="flex-shrink-0 text-muted-foreground hover:text-base-foreground transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}
        {isLoading ? (
          <div className="rounded-xl border border-muted/50 bg-white p-8 text-sm text-muted-foreground text-center">
            Loading bookings...
          </div>
        ) : bookings && bookings.length > 0 ? (
          <BookingsList bookings={bookings} showInstructor />
        ) : (
          <div className="rounded-xl border border-muted/50 bg-white p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="text-4xl mb-4">📅</div>
              <h3 className="text-lg font-semibold text-base-foreground mb-2">No bookings yet</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Once you book a session with a mentor, it will appear here with payment status and meeting details.
              </p>
              <a
                href="/instructors"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-hover hover:shadow-md"
              >
                Browse Mentors
              </a>
            </div>
          </div>
        )}
      </PageShell>
    </AuthGuard>
  );
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardPageInner />
    </Suspense>
  );
}
