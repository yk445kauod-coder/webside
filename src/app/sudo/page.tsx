import type { Metadata } from "next";
import { getSudoQueue } from "@/lib/queries/sudo";
import { SudoQueue } from "@/components/site/sudo-queue";

export const metadata: Metadata = { title: "Review · SUDO" };

export default async function SudoHomePage() {
  const { open, resolved, totals } = await getSudoQueue();

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="ws-h1">Review queue</h1>
          <p className="mt-1 text-muted">
            Every submitted version is reviewed exactly as it was frozen at
            submission time.
          </p>
        </div>
        <div className="flex gap-6 text-center">
          <Stat label="Customers" value={totals.customers} />
          <Stat label="Sites" value={totals.sites} />
          <Stat label="Approved" value={totals.approved} />
        </div>
      </div>

      <SudoQueue open={open} resolved={resolved} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-2.5">
      <p className="text-2xl font-semibold tracking-tight text-ink">{value}</p>
      <p className="text-xs font-medium uppercase tracking-wider text-muted">{label}</p>
    </div>
  );
}