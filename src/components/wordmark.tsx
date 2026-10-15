import { cn } from "@/lib/utils";

interface WordmarkProps {
  variant?: "primary" | "mono-ink" | "mono-white";
  className?: string;
  /** Compact sizes down the wordmark for headers/toolbars. */
  compact?: boolean;
}

/**
 * The WebSide wordmark — typography only, as specified by the design system.
 * It is decorative text; assistive tech sees the full name once.
 */
export function Wordmark({
  variant = "primary",
  className,
  compact = false,
}: WordmarkProps) {
  return (
    <span
      className={cn(
        "ws-wordmark inline-flex items-baseline select-none",
        compact ? "text-xl" : "text-2xl",
        className,
      )}
      data-variant={variant}
      aria-hidden="true"
    >
      <span className="ws-wordmark-web">Web</span>
      <span className="ws-wordmark-side">Side</span>
    </span>
  );
}

/** Accessible full name for logs/aria where a single reading string is needed. */
export function WordmarkFullName() {
  return <span className="sr-only">WebSide</span>;
}