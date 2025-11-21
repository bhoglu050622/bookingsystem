"use client";

import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { PageShell } from "@/components/layout/page-shell";

export default function LoginPage() {
  return (
    <PageShell className="flex min-h-[70vh] items-center justify-center">
      <Suspense>
        <AuthForm mode="login" />
      </Suspense>
    </PageShell>
  );
}
