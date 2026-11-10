import { cn } from "@/lib/utils";

interface WordmarkProps {
  variant?: "primary" | "mono-ink" | "mono-white";
  className?: string;
  compact?: boolean;
}

/** The official animated WebSide logo (motion kit web component). */
export function Wordmark({ variant = "primary", className, compact = false }: WordmarkProps) {
  return (
    <webside-logo
      slogan="false"
      speed="1.5"
      theme={variant === "mono-white" ? "dark" : undefined}
      class={cn("inline-block select-none", className)}
      style={{ width: compact ? 112 : 150, display: "inline-block" }}
      role="img"
      aria-label="WebSide"
    />
  );
}

export function WordmarkFullName() {
  return <span className="sr-only">WebSide</span>;
}
