"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success" | "outline";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-cobalt text-white hover:bg-cobalt-strong active:bg-cobalt-stronger shadow-ws-sm",
  secondary: "bg-ink text-white hover:bg-ink-strong active:bg-ink-stronger",
  success: "bg-success text-white hover:bg-success-strong active:bg-success-stronger",
  outline:
    "border border-line bg-surface text-ink hover:border-ink/30 hover:bg-ink-soft/60",
  ghost: "text-ink hover:bg-ink-soft",
  danger: "bg-danger text-white hover:bg-danger-strong",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-11 px-5 text-[15px] gap-2",
};

const base =
  "inline-flex items-center justify-center rounded-ws font-medium transition-colors duration-150 " +
  "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-cobalt/30";

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
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        base,
        variants[variant],
        sizes[size],
        (disabled || loading) && "pointer-events-none opacity-60",
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
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

/** A link that looks like a button. Internal links use client-side navigation. */
export function LinkButton({
  variant = "primary",
  size = "md",
  href,
  children,
  className,
  external,
}: LinkButtonProps) {
  const classes = cn(base, variants[variant], sizes[size], className);
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}
