export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={`h-4 w-4 animate-spin rounded-full border-2 border-ink/20 border-t-ink ${className ?? ""}`}
    />
  );
}