import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/utils/cn";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "outline";
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        variant === "default" && "border-transparent bg-stone-900 text-white",
        variant === "secondary" &&
          "border-stone-200 bg-stone-100 text-stone-600",
        variant === "outline" && "border-stone-300 text-stone-500",
        className
      )}
      {...props}
    />
  )
);
Badge.displayName = "Badge";
