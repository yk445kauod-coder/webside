"use client";

import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success" | "outline";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-cobalt text-white hover:bg-[#3357c9] active:bg-[#2b4cb0] shadow-[0_1px_2px_rgba(23,33,43,0.25)]",
  secondary: "bg-ink text-white hover:bg-[#101820] active:bg-[#0a1016]",
  success: "bg-success text-white hover:bg-[#116c44] active:bg-[#0e5a39]",
  outline:
    "border border-line bg-surface text-ink hover:border-ink/30 hover:bg-ink-soft/60",
  ghost: "text-ink hover:bg-ink-soft",
  danger: "bg-danger text-white hover:bg-[#a73333]",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-11 px-5 text-[15px] gap-2",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-[10px] font-medium transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-cobalt/30",
        variants[variant],
        sizes[size],
        (disabled || loading) && "pointer-events-none opacity-60",
        className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {children}
    </button>
  );
}

interface LinkButtonProps {
  variant?: Variant;
  size?: Size;
  href: string;
  className?: string;
  children: React.ReactNode;
  external?: boolean;
}

export function LinkButton({
  variant = "primary",
  size = "md",
  href,
  children,
  className,
  external,
}: LinkButtonProps) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className={cn(
        "inline-flex items-center justify-center rounded-[10px] font-medium transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-cobalt/30",
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {children}
    </a>
  );
}