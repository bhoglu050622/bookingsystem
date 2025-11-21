import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-shimmer rounded-xl bg-gradient-to-r from-muted/70 via-muted to-muted/70 bg-[length:200%_100%]",
        className,
      )}
      {...props}
    />
  );
}

