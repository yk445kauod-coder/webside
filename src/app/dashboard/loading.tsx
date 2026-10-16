export default function DashboardLoading() {
  return (
    <div aria-busy="true" aria-label="Loading your sites">
      <div className="mb-8 space-y-3">
        <div className="h-9 w-48 animate-pulse rounded-lg bg-ink-soft" />
        <div className="h-4 w-72 animate-pulse rounded bg-ink-soft" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="h-44 animate-pulse rounded-2xl border border-line bg-surface" />
        ))}
      </div>
    </div>
  );
}
