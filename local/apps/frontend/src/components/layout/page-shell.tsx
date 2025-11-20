import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type PageShellProps = {
  children: ReactNode;
  className?: string;
};

export function PageShell({ children, className }: PageShellProps) {
  return (
    <main className={cn("mx-auto w-full max-w-6xl px-4 py-12 sm:px-6", className)}>
      {children}
    </main>
  );
}

