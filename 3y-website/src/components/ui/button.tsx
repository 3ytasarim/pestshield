"use client";

import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { type ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#06060a] disabled:opacity-50 disabled:cursor-not-allowed",
          {
            // Primary
            "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30 active:scale-[0.98]":
              variant === "primary",
            // Secondary — ghost white
            "bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 active:scale-[0.98]":
              variant === "secondary",
            // Outline
            "border border-blue-500/50 hover:border-blue-400 text-blue-400 hover:text-blue-300 hover:bg-blue-500/5 active:scale-[0.98]":
              variant === "outline",
            // Ghost
            "text-zinc-400 hover:text-white hover:bg-white/5 active:scale-[0.98]":
              variant === "ghost",
          },
          {
            "text-sm px-4 py-2 h-9": size === "sm",
            "text-sm px-5 py-2.5 h-10": size === "md",
            "text-base px-6 py-3 h-12": size === "lg",
          },
          className
        )}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);

Button.displayName = "Button";
export { Button };
