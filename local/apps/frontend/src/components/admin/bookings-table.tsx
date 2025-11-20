import { AdminBooking } from "@/lib/types";
import { Button } from "@/components/ui/button";

type BookingsTableProps = {
  bookings: AdminBooking[];
  onRefund: (bookingId: string) => void;
  isRefunding?: string | null;
};

export function BookingsTable({ bookings, onRefund, isRefunding }: BookingsTableProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-muted/70 bg-white/80 shadow-subtle">
      <table className="min-w-full divide-y divide-muted/40 text-sm">
        <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 text-left font-semibold">Booking</th>
            <th className="px-4 py-3 text-left font-semibold">Instructor</th>
            <th className="px-4 py-3 text-left font-semibold">Start</th>
            <th className="px-4 py-3 text-left font-semibold">Status</th>
            <th className="px-4 py-3 text-left font-semibold">Payment</th>
            <th className="px-4 py-3 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-muted/40 text-base-foreground">
          {bookings.map((booking) => {
            const transaction = booking.transactions?.[0];
            return (
              <tr key={booking.id}>
                <td className="px-4 py-4">
                  <div className="font-semibold">{booking.user.email}</div>
                  <div className="text-xs text-muted-foreground">{booking.id}</div>
                </td>
                <td className="px-4 py-4">{booking.instructor.displayName}</td>
                <td className="px-4 py-4">
                  <div>{new Date(booking.scheduledStart).toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">
                    {booking.timezone}
                  </div>
                </td>
                <td className="px-4 py-4 text-xs font-semibold uppercase text-muted-foreground">
                  {booking.status.replace(/_/g, " ")}
                </td>
                <td className="px-4 py-4">
                  {transaction ? (
                    <div>
                      <div className="font-semibold">
                        ₹{(transaction.amount / 100).toLocaleString("en-IN")}{" "}
                        {transaction.currency}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {transaction.status}
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">No payment</span>
                  )}
                </td>
                <td className="px-4 py-4 text-right">
                  <Button
                    variant="secondary"
                    onClick={() => onRefund(booking.id)}
                    disabled={isRefunding === booking.id}
                  >
                    {isRefunding === booking.id ? "Processing…" : "Refund"}
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

