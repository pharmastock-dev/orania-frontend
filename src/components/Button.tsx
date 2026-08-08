import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  icon?: ReactNode;
  loading?: boolean;
}

const variants: Record<string, string> = {
  primary: "bg-[var(--color-orange-500)] text-white hover:bg-[var(--color-orange-600)] disabled:bg-[var(--color-ink-300)]",
  secondary: "bg-[var(--color-navy-900)] text-white hover:bg-[var(--color-navy-800)] disabled:bg-[var(--color-ink-300)]",
  outline: "bg-white border border-[var(--color-ink-100)] text-[var(--color-ink-900)] hover:border-[var(--color-orange-500)]",
  ghost: "bg-transparent text-[var(--color-ink-700)] hover:bg-[var(--color-ink-50)]",
  danger: "bg-red-50 text-red-600 hover:bg-red-100",
};

const sizes: Record<string, string> = {
  sm: "text-sm px-3 py-2 rounded-lg",
  md: "text-[15px] px-4 py-3 rounded-xl",
  lg: "text-base px-5 py-4 rounded-xl",
};

export default function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  icon,
  loading = false,
  children,
  className = "",
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 font-semibold transition-colors disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${
        fullWidth ? "w-full" : ""
      } ${className}`}
      {...rest}
    >
      {loading ? <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> : icon}
      {children}
    </button>
  );
}
