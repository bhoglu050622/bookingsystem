"use client";

import type { BookingSummary } from "@/lib/types";
import { format } from "date-fns";

type BookingsListProps = {
  bookings: BookingSummary[];
  showInstructor?: boolean;
  showStudent?: boolean;
};

export function BookingsList({ bookings, showInstructor = false, showStudent = false }: BookingsListProps) {
  if (bookings.length === 0) {
    return (
      <div className="rounded-3xl border border-muted/70 bg-white/80 p-8 text-sm text-muted-foreground">
        No bookings found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <div
          key={booking.id}
          className="rounded-xl border border-muted/50 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-base-foreground mb-1">
                    {showInstructor && booking.instructor
                      ? booking.instructor.displayName
                      : showStudent && booking.user
                        ? `${booking.user.firstName || ""} ${booking.user.lastName || ""}`.trim() || booking.user.email
                        : "Session"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(booking.scheduledStart), "EEEE, MMMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${
                    booking.status === "CONFIRMED"
                      ? "bg-success/10 text-success"
                      : booking.status === "PAID"
                        ? "bg-info/10 text-info"
                        : booking.status === "PENDING"
                          ? "bg-warning/10 text-warning"
                          : "bg-muted text-muted-foreground"
                  }`}
                >
                  {booking.status.replace("_", " ")}
                </span>
              </div>

              <div className="flex flex-wrap gap-4 text-sm">
                <span className="text-muted-foreground">
                  <span className="font-medium text-base-foreground">
                    {Math.round((new Date(booking.scheduledEnd).getTime() - new Date(booking.scheduledStart).getTime()) / 60000)} min
                  </span> duration
                </span>
                <span className="text-muted-foreground">
                  <span className="font-semibold text-primary">
                    {booking.priceCurrency} {(booking.priceAmount / 100).toFixed(2)}
                  </span>
                </span>
              </div>

              {booking.meetLink && (
                <div className="pt-4 mt-4 border-t border-muted/50">
                  <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <svg
                          className="h-5 w-5 text-primary"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Meeting Link</p>
                        <a
                          href={booking.meetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline break-all"
                        >
                          {booking.meetLink}
                        </a>
                      </div>
                    </div>
                  <a
                    href={booking.meetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-hover hover:shadow-lg active:scale-95"
                  >
                    <svg
                        className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Join Meeting
                  </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

