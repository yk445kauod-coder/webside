import type { Metadata } from "next";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { getDashboardSites, type DashboardSite } from "@/lib/queries/dashboard";
import { Badge } from "@/components/ui/badge";
import { NewSiteModal } from "@/components/site/new-site-modal";
import { submissionStatus } from "@/lib/submission-status";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "My sites" };

// Reads cookies to identify the signed-in user.

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ forbidden?: string }>;
}) {
  const { forbidden } = await searchParams;
  const user = await getSessionUser();
  const sites: DashboardSite[] = user ? await getDashboardSites(user.id) : [];

  return (
    <div>
      {forbidden === "sudo" ? (
        <p role="alert" className="mb-6 rounded-xl border border-line bg-warning-soft px-4 py-3 text-sm text-warning">
          That area is for the WebSide owner. Your account doesn&apos;t have access to it.
        </p>
      ) : null}

      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="ws-h1">My sites</h1>
          <p className="mt-1 text-muted">
            Build, save, submit, and track every site you own.
          </p>
        </div>
        {sites.length > 0 ? <NewSiteModal /> : null}
      </div>

      {sites.length === 0 ? <EmptyState /> : <SiteGrid sites={sites} />}
    </div>
  );
}

function SiteGrid({ sites }: { sites: DashboardSite[] }) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2">
      {sites.map(({ site, latestSubmission, latestPublication, pageCount }) => {
        const status = latestSubmission ? submissionStatus(latestSubmission.status) : null;
        return (
          <li key={site.id}>
            <Link
              href={`/dashboard/sites/${site.slug}`}
              className="group flex h-full flex-col rounded-2xl border border-line bg-surface p-5 shadow-ws-sm transition-all hover:-translate-y-0.5 hover:shadow-ws"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="ws-h2 truncate group-hover:text-cobalt">{site.name}</h2>
                  <p className="mt-0.5 truncate font-mono text-xs text-muted">/{site.slug}</p>
                </div>
                <Badge tone={status?.tone ?? "neutral"}>{status?.label ?? "Draft"}</Badge>
              </div>

              <p className="mt-3 text-sm text-muted">
                {pageCount} page{pageCount === 1 ? "" : "s"} · Last saved{" "}
                {formatDate(site.updated_at)}
              </p>

              {latestPublication ? (
                <p className="mt-2 flex items-center gap-1.5 truncate text-sm text-success">
                  <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5" />
                    <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5" />
                  </svg>
                  <span className="sr-only">Live at</span>
                  <span className="truncate font-mono text-xs">
                    {latestPublication.url.replace(/^https?:\/\//, "")}
                  </span>
                </p>
              ) : null}

              {latestSubmission?.status === "rejected" && latestSubmission.owner_notes ? (
                <p className="mt-3 line-clamp-2 rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger">
                  Owner feedback: {latestSubmission.owner_notes}
                </p>
              ) : null}

              <span className="min-h-4 flex-1" aria-hidden="true" />
              <div className="flex items-center gap-1.5 border-t border-line pt-4 text-sm font-semibold text-cobalt">
                Open editor
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-surface px-6 py-20 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cobalt-soft">
        <svg className="h-6 w-6 text-cobalt" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M4 4h16v16H4z" />
          <path d="M9 8h6M9 12h6M9 16h4" />
        </svg>
      </div>
      <h2 className="ws-h2">You haven&apos;t built a site yet</h2>
      <p className="mt-2 max-w-sm text-sm text-muted">
        Start a blank canvas or use a template. Everything you make stays yours.
      </p>
      <div className="mt-6">
        <NewSiteModal />
      </div>
    </div>
  );
}
