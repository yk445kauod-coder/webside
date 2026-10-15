import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDashboardSites } from "@/lib/queries/dashboard";
import { Badge } from "@/components/ui/badge";
import { submissionStatus } from "@/lib/submission-status";
import { NewSiteModal } from "@/components/site/new-site-modal";
import { formatDate } from "@/lib/utils";
import type { DashboardSite } from "@/lib/queries/dashboard";

export const metadata: Metadata = { title: "My sites" };

// Reads cookies to identify the signed-in user.
export const instant = false;

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const sites: DashboardSite[] = user ? await getDashboardSites(user.id) : [];

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="ws-h1">My sites</h1>
          <p className="mt-1 text-muted">
            Build, save, submit, and track every site you own.
          </p>
        </div>
        <NewSiteModal />
      </div>

      {sites.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {sites.map(({ site, latestSubmission, publications, pages }) => {
            const statusMeta = latestSubmission
              ? submissionStatus(latestSubmission.status)
              : null;
            const liveUrl = publications[0];
            return (
              <Link
                key={site.id}
                href={`/dashboard/sites/${site.slug}`}
                className="group flex flex-col rounded-2xl border border-line bg-surface p-5 shadow-ws-sm transition-all hover:-translate-y-0.5 hover:shadow-ws"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="ws-h2 group-hover:text-cobalt">
                      {site.name}
                    </h2>
                    <p className="mt-0.5 font-mono text-xs text-muted">
                      /{site.slug}
                    </p>
                  </div>
                  {statusMeta ? (
                    <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
                  ) : (
                    <Badge>Draft</Badge>
                  )}
                </div>

                <p className="mt-3 line-clamp-2 text-sm text-muted">
                  {pages.length} page{pages.length === 1 ? "" : "s"} · Last
                  saved{" "}
                  {site.updated_at ? formatDate(site.updated_at) : "—"}
                </p>

                {liveUrl ? (
                  <p className="mt-2 flex items-center gap-1.5 truncate text-sm text-success">
                    <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 15v6m0-6l-4 4m4-4l4 4" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-1" />
                    </svg>
                    <span className="truncate font-mono text-xs">
                      {liveUrl.url.replace(/^https?:\/\//, "")}
                    </span>
                  </p>
                ) : null}

                <div className="mt-4 flex items-center gap-1.5 border-t border-line pt-4 text-sm font-semibold text-cobalt">
                  Open editor
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-surface px-6 py-20 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cobalt-soft">
        <svg className="h-6 w-6 text-cobalt" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
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