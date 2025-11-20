"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useAuthState } from "@/hooks/use-auth";

type AdminGuardProps = {
  children: ReactNode;
};

export function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const { user, isHydrated } = useAuthState();

  useEffect(() => {
    if (isHydrated && user?.role !== "ADMIN") {
      router.replace("/");
    }
  }, [isHydrated, user, router]);

  if (!isHydrated || user?.role !== "ADMIN") {
    return null;
  }

  return <>{children}</>;
}

