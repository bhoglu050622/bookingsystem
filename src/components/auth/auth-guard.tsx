"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useAuthState } from "@/hooks/use-auth";

type AuthGuardProps = {
  children: ReactNode;
  redirectTo?: string;
};

export function AuthGuard({ children, redirectTo = "/auth/login" }: AuthGuardProps) {
  const router = useRouter();
  const { user, isHydrated } = useAuthState();

  useEffect(() => {
    if (isHydrated && !user) {
      router.replace(redirectTo);
    }
  }, [isHydrated, user, redirectTo, router]);

  if (!isHydrated) {
    return null;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}

