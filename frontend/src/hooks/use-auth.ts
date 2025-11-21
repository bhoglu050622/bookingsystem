"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useMemo } from "react";
import { login, register, fetchProfile } from "@/services/auth";
import { useAuthStore } from "@/stores/auth-store";

export function useAuthActions() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: async (data) => {
      setAuth(data.user, data.accessToken);
      router.push("/dashboard");
    },
  });

  const registerMutation = useMutation({
    mutationFn: register,
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
      router.push("/dashboard");
    },
  });

  const refetchProfile = async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    const profile = await fetchProfile(token);
    useAuthStore.getState().setUser(profile);
  };

  const logout = () => {
    clearAuth();
    router.push("/");
  };

  return {
    loginMutation,
    registerMutation,
    logout,
    refetchProfile,
  };
}

export function useAuthState() {
  // Use individual selectors to avoid creating new objects on every render
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  // Memoize the return object to ensure stable reference
  return useMemo(
    () => ({
      user,
      token,
      isHydrated,
    }),
    [user, token, isHydrated],
  );
}

