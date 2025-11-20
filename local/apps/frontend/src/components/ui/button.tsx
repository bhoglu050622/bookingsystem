"use client";

import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

const buttonVariants = {
  primary:
    "bg-primary text-white font-semibold shadow-lg hover:bg-primary-hover hover:shadow-xl active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
  secondary:
    "bg-white text-primary border-2 border-primary font-semibold shadow-sm hover:bg-primary-muted hover:border-primary-dark transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
  accent:
    "bg-accent text-white font-semibold shadow-md hover:bg-accent/90 hover:shadow-lg active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent transition-all duration-200 disabled:opacity-50",
  subtle:
    "bg-muted text-muted-foreground font-medium hover:bg-muted-dark hover:text-base-foreground transition-all duration-200 active:scale-95",
  ghost: "hover:bg-primary-muted text-primary font-medium hover:text-primary-dark transition-all duration-200 active:scale-95",
};

type Variant = keyof typeof buttonVariants;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  asChild?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", type = "button", asChild = false, ...props },
    ref,
  ) => {
    const Component = asChild ? Slot : "button";
    return (
      <Component
        ref={ref}
        type={asChild ? undefined : type}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 min-h-[44px]",
          buttonVariants[variant],
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

