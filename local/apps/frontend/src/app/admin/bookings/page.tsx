"use client";

import { useState } from "react";
import { useAuthState } from "@/hooks/use-auth";
import { useAdminBookings, useManualRefund } from "@/hooks/use-admin";
import { PageShell } from "@/components/layout/page-shell";
import { AdminGuard } from "@/components/auth/admin-guard";
import { BookingsTable } from "@/components/admin/bookings-table";

export default function AdminBookingsPage() {
  const { token } = useAuthState();
  const { data } = useAdminBookings(token);
  const refundMutation = useManualRefund(token);
  const [refundId, setRefundId] = useState<string | null>(null);

  const handleRefund = (bookingId: string) => {
    if (!token) return;
    setRefundId(bookingId);
    refundMutation.mutate(
      { bookingId },
      {
        onSettled: () => setRefundId(null),
      },
    );
  };

  return (
    <AdminGuard>
      <PageShell className="space-y-8">
        <div>
          <h1 className="text-3xl font-semibold text-base-foreground">Bookings</h1>
          <p className="text-sm text-muted-foreground">
            Review recent sessions and trigger manual refunds when required.
          </p>
        </div>
        {data ? (
          <BookingsTable bookings={data} onRefund={handleRefund} isRefunding={refundId} />
        ) : (
          <p className="text-sm text-muted-foreground">Loading bookings…</p>
        )}
        {refundMutation.isError ? (
          <p className="text-xs text-danger">
            {(refundMutation.error as Error).message ?? "Refund failed"}
          </p>
        ) : null}
      </PageShell>
    </AdminGuard>
  );
}

