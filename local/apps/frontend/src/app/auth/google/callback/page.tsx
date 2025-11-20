"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { PageShell } from "@/components/layout/page-shell";

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    const token = searchParams.get("token");
    const userParam = searchParams.get("user");

    if (token && userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam));
        setAuth(user, token);
        router.push("/dashboard");
      } catch (error) {
        console.error("Failed to parse user data:", error);
        router.push("/auth/login?error=Failed to sign in");
      }
    } else {
      router.push("/auth/login?error=Missing authentication data");
    }
  }, [searchParams, router, setAuth]);

  return (
    <PageShell className="flex min-h-[70vh] items-center justify-center">
      <div className="text-center">
        <div className="mb-4">Signing you in...</div>
        <div className="text-sm text-muted-foreground">Please wait</div>
      </div>
    </PageShell>
  );
}

