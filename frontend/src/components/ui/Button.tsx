import { type ButtonHTMLAttributes, forwardRef } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/utils/cn";

type Variant =
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link";
type Size = "default" | "sm" | "lg" | "icon";

const variantClasses: Record<Variant, string> = {
  default: "bg-blue-500 text-white hover:bg-blue-600 shadow-sm",
  destructive: "bg-red-500 text-white hover:bg-red-600",
  outline:
    "border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 hover:border-stone-300",
  secondary: "bg-stone-100 text-stone-700 hover:bg-stone-200",
  ghost: "hover:bg-stone-100 text-stone-600 hover:text-stone-900",
  link: "text-blue-500 underline-offset-4 hover:underline",
};

const sizeClasses: Record<Size, string> = {
  default: "h-9 px-4 py-2 text-sm rounded-lg font-semibold",
  sm: "h-8 px-3 text-xs rounded-md font-semibold",
  lg: "h-10 px-6 py-2.5 text-base rounded-xl font-semibold",
  icon: "h-9 w-9 rounded-full font-semibold",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
  to?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "default",
      size = "default",
      className = "",
      asChild,
      to,
      children,
      ...props
    },
    ref
  ) => {
    const classes = `inline-flex items-center justify-center gap-2 transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

    if (asChild && to) {
      return (
        <Link to={to} className={classes}>
          {children}
        </Link>
      );
    }

    return (
      <button ref={ref} className={classes} {...props}>
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
