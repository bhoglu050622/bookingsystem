"use client";

import { useEffect, useState } from "react";
import { fetchProfile } from "@/services/auth";
import { useAuthStore } from "@/stores/auth-store";

export function AuthInitializer() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!token || user) {
      setIsReady(true);
      return;
    }

    let cancelled = false;

    const hydrateProfile = async () => {
      try {
        const profile = await fetchProfile(token);
        if (!cancelled) {
          setUser(profile);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to hydrate auth profile", error);
          clearAuth();
        }
      } finally {
        if (!cancelled) {
          setIsReady(true);
        }
      }
    };

    hydrateProfile();

    return () => {
      cancelled = true;
    };
  }, [isHydrated, token, user, setUser, clearAuth]);

  if (!isHydrated || !isReady) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-base/80 text-sm text-muted-foreground">
        Preparing your workspace…
      </div>
    );
  }

  return null;
}

