"use client";

import { useAuthState } from "@/hooks/use-auth";
import { useAdminOverview } from "@/hooks/use-admin";
import { OverviewCards } from "@/components/admin/overview-cards";
import { AdminGuard } from "@/components/auth/admin-guard";
import { PageShell } from "@/components/layout/page-shell";

export default function AdminDashboardPage() {
  const { token } = useAuthState();
  const { data } = useAdminOverview(token);

  return (
    <AdminGuard>
      <PageShell className="space-y-8">
        <div>
          <h1 className="text-3xl font-semibold text-base-foreground">Admin overview</h1>
          <p className="text-sm text-muted-foreground">
            Monitor instructors, bookings, and revenue at a glance.
          </p>
        </div>
        <OverviewCards data={data} />
      </PageShell>
    </AdminGuard>
  );
}

