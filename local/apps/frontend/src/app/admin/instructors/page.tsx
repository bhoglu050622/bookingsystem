"use client";

import { useState } from "react";
import { useAuthState } from "@/hooks/use-auth";
import { useAdminInstructors, useUpdateInstructor } from "@/hooks/use-admin";
import { PageShell } from "@/components/layout/page-shell";
import { AdminGuard } from "@/components/auth/admin-guard";
import { InstructorsTable } from "@/components/admin/instructors-table";

export default function AdminInstructorsPage() {
  const { token } = useAuthState();
  const { data } = useAdminInstructors(token);
  const updateMutation = useUpdateInstructor(token);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleToggle = (id: string, active: boolean) => {
    if (!token) return;
    setUpdatingId(id);
    updateMutation.mutate(
      { id, payload: { active } },
      {
        onSettled: () => setUpdatingId(null),
      },
    );
  };

  return (
    <AdminGuard>
      <PageShell className="space-y-8">
        <div>
          <h1 className="text-3xl font-semibold text-base-foreground">Manage instructors</h1>
          <p className="text-sm text-muted-foreground">
            Activate or pause profiles and adjust pricing for your marketplace.
          </p>
        </div>
        {data ? (
          <InstructorsTable
            instructors={data}
            onToggleActive={handleToggle}
          />
        ) : (
          <p className="text-sm text-muted-foreground">Loading instructors…</p>
        )}
        {updatingId ? (
          <p className="text-xs text-muted-foreground">Updating instructor…</p>
        ) : null}
      </PageShell>
    </AdminGuard>
  );
}

