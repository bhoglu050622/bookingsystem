"use client";

import { AuthForm } from "@/components/auth/auth-form";
import { PageShell } from "@/components/layout/page-shell";

export default function SignupPage() {
  return (
    <PageShell className="flex min-h-[70vh] items-center justify-center">
      <AuthForm mode="register" />
    </PageShell>
  );
}

