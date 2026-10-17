import { cn } from "@/lib/utils";

/** Small inline progress indicator. Announces itself to assistive tech. */
export function Spinner({
  className,
  label = "Loading",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span role="status" className="inline-flex">
      <span
        aria-hidden="true"
        className={cn(
          "h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent",
          className,
        )}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}
