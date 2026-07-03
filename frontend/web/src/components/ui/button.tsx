import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-slate-900 text-white shadow-sm hover:bg-slate-800":
              variant === "default",
            "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50":
              variant === "outline",
            "text-slate-600 hover:bg-slate-100": variant === "ghost",
            "bg-red-600 text-white hover:bg-red-700":
              variant === "destructive",
          },
          {
            "h-11 px-4 py-2": size === "default",
            "h-9 px-3": size === "sm",
            "h-12 px-8": size === "lg",
            "h-11 w-11": size === "icon",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
