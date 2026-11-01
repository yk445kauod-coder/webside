import { cn } from "@/lib/utils";

type Tone = "neutral" | "copper" | "success" | "warning" | "danger" | "orange";

const tones: Record<Tone, string> = {
  neutral: "bg-ink-soft text-ink",
  copper: "bg-copper-soft text-copper",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  orange: "bg-orange-soft text-orange-ink",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
