export default function SudoLoading() {
  return (
    <div aria-busy="true" aria-label="Loading the review queue">
      <div className="mb-8 h-9 w-56 animate-pulse rounded-lg bg-ink-soft" />
      <div className="grid gap-4 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-2xl border border-line bg-surface" />
        ))}
      </div>
    </div>
  );
}
