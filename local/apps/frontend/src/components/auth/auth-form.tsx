"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuthActions } from "@/hooks/use-auth";

type AuthFormProps = {
  mode: "login" | "register";
};

export function AuthForm({ mode }: AuthFormProps) {
  const searchParams = useSearchParams();
  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });

  const { loginMutation, registerMutation } = useAuthActions();
  const mutation = mode === "login" ? loginMutation : registerMutation;
  
  const error = searchParams?.get("error");

  const handleGoogleSignIn = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    window.location.href = `${apiUrl}/auth/google/signin`;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mode === "login") {
      mutation.mutate({ email: form.email, password: form.password });
    } else {
      mutation.mutate({
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
      });
    }
  };

  const isLoading = mutation.isPending;
  const heading = mode === "login" ? "Welcome back" : "Create your account";
  const description =
    mode === "login"
      ? "Access your dashboard, manage bookings, and stay on top of your sessions."
      : "Sign up to start hosting or booking expert sessions in minutes.";

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-base-foreground">{heading}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      
      
      
      {error && (
        <div className="rounded-xl bg-danger/10 px-3 py-2 text-xs text-danger">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-muted/70 bg-white/90 p-6 shadow-subtle">
        {mode === "register" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="firstName" className="text-xs font-semibold text-muted-foreground">
                First name
              </label>
              <input
                id="firstName"
                type="text"
                required
                className="rounded-xl border border-muted px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
                value={form.firstName}
                onChange={(event) => setForm((state) => ({ ...state, firstName: event.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="lastName" className="text-xs font-semibold text-muted-foreground">
                Last name
              </label>
              <input
                id="lastName"
                type="text"
                required
                className="rounded-xl border border-muted px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
                value={form.lastName}
                onChange={(event) => setForm((state) => ({ ...state, lastName: event.target.value }))}
              />
            </div>
          </div>
        ) : null}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-xs font-semibold text-muted-foreground">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            className="rounded-xl border border-muted px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
            value={form.email}
            onChange={(event) => setForm((state) => ({ ...state, email: event.target.value }))}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-xs font-semibold text-muted-foreground">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className="rounded-xl border border-muted px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
            value={form.password}
            onChange={(event) => setForm((state) => ({ ...state, password: event.target.value }))}
          />
        </div>
        {mutation.isError ? (
          <p className="rounded-xl bg-danger/10 px-3 py-2 text-xs text-danger">
            {(mutation.error as Error).message ?? "Something went wrong. Please try again."}
          </p>
        ) : null}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          {mode === "login" ? (
            <>
              Don&apos;t have an account?{" "}
              <Link href="/auth/signup" className="font-semibold text-primary hover:underline">
                Sign up
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href="/auth/login" className="font-semibold text-primary hover:underline">
                Sign in
              </Link>
            </>
          )}
        </p>
      </form>
    </div>
  );
}
