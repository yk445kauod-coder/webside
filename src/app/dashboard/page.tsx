import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Globe,
  LayoutGrid,
  Plus,
  Sparkles,
  Wand2,
} from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { getDashboardSites, type DashboardSite } from "@/lib/queries/dashboard";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { submissionStatus, isOpenStatus } from "@/lib/submission-status";
import { InstallPrompt } from "@/components/pwa/pwa";
import { coverFor } from "@/lib/cover";
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

  const live = sites.filter((s) => s.latestPublication).length;
  const inReview = sites.filter(
    (s) => s.latestSubmission && isOpenStatus(s.latestSubmission.status),
  ).length;

  return (
    <div>
      <InstallPrompt />
      {forbidden === "sudo" ? (
        <p role="alert" className="mb-6 rounded-2xl border border-line bg-warning-soft px-4 py-3 text-sm text-warning">
          That area is for the WebSide owner. Your account doesn&apos;t have access to it.
        </p>
      ) : null}

      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="ws-eyebrow mb-2">Your space</p>
          <h1 className="ws-h1">
            My <span className="ws-gradient-text">sites</span>
          </h1>
        </div>
        {sites.length > 0 ? (
          <LinkButton href="/dashboard/new" size="lg">
            <Plus className="h-5 w-5" aria-hidden="true" />
            New site
          </LinkButton>
        ) : null}
      </div>

      {sites.length > 0 ? (
        <dl className="mb-8 grid grid-cols-3 gap-3">
          <Stat icon={LayoutGrid} label="Sites" value={sites.length} />
          <Stat icon={Clock3} label="In review" value={inReview} />
          <Stat icon={Globe} label="Live" value={live} />
        </dl>
      ) : null}

      {sites.length === 0 ? <EmptyState /> : <SiteGrid sites={sites} />}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof LayoutGrid;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 shadow-ws-sm">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-cobalt-soft text-cobalt">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div>
        <dd className="text-2xl font-semibold leading-none tracking-tight">{value}</dd>
        <dt className="mt-1 text-xs text-muted">{label}</dt>
      </div>
    </div>
  );
}

function SiteGrid({ sites }: { sites: DashboardSite[] }) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {sites.map(({ site, latestSubmission, latestPublication, pageCount }) => {
        const status = latestSubmission ? submissionStatus(latestSubmission.status) : null;
        const cover = coverFor(site.slug);
        return (
          <li key={site.id}>
            <Link
              href={`/dashboard/sites/${site.slug}`}
              className="ws-card-glow group flex h-full flex-col overflow-hidden"
            >
              <div
                className="relative h-32 overflow-hidden"
                style={{ background: cover.background }}
              >
                <div aria-hidden="true" className="ws-dots-ink absolute inset-0 opacity-40 mix-blend-overlay" />
                <span
                  aria-hidden="true"
                  className="absolute -bottom-6 -right-2 text-[7rem] font-black leading-none text-white/25 transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-110"
                >
                  {site.name.slice(0, 1).toUpperCase()}
                </span>
                <div className="absolute left-4 top-4">
                  <Badge tone={status?.tone ?? "neutral"} className="bg-white/90 shadow-sm backdrop-blur">
                    {status?.label ?? "Draft"}
                  </Badge>
                </div>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <h2 className="ws-h2 truncate">{site.name}</h2>
                <p className="mt-0.5 truncate font-mono text-xs text-muted">/{site.slug}</p>

                <p className="mt-3 text-sm text-muted">
                  {pageCount} page{pageCount === 1 ? "" : "s"} · Saved {formatDate(site.updated_at)}
                </p>

                {latestPublication ? (
                  <p className="mt-2 flex items-center gap-1.5 truncate text-sm text-success">
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span className="sr-only">Live at</span>
                    <span className="truncate font-mono text-xs">
                      {latestPublication.url.replace(/^https?:\/\//, "")}
                    </span>
                  </p>
                ) : null}

                {latestSubmission?.status === "rejected" && latestSubmission.owner_notes ? (
                  <p className="mt-3 line-clamp-2 rounded-xl bg-danger-soft px-3 py-2 text-xs text-danger">
                    Owner feedback: {latestSubmission.owner_notes}
                  </p>
                ) : null}

                <span className="min-h-4 flex-1" aria-hidden="true" />
                <div className="mt-4 flex items-center justify-between border-t border-line pt-4 text-sm font-semibold text-cobalt">
                  <span className="flex items-center gap-1.5">
                    {latestSubmission?.status === "approved" ? (
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    ) : null}
                    Open editor
                  </span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </div>
              </div>
            </Link>
          </li>
        );
      })}

      <li>
        <Link
          href="/dashboard/new"
          className="group flex h-full min-h-64 flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-line bg-surface/60 p-6 text-center transition hover:border-cobalt hover:bg-cobalt-soft/60"
        >
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-cobalt-soft text-cobalt transition group-hover:scale-110 group-hover:bg-cobalt group-hover:text-white">
            <Plus className="h-7 w-7" aria-hidden="true" />
          </span>
          <span className="text-[15px] font-semibold">Build a new site</span>
          <span className="max-w-[14rem] text-xs text-muted">Answer a few questions. We do the rest.</span>
        </Link>
      </li>
    </ul>
  );
}

function EmptyState() {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-line bg-surface px-6 py-16 text-center shadow-ws-sm sm:py-24">
      <div aria-hidden="true" className="ws-dots-ink absolute inset-0 opacity-50" />
      <div aria-hidden="true" className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-cobalt/20 blur-3xl" />
      <div aria-hidden="true" className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-[#ff5fa2]/20 blur-3xl" />

      <div className="relative">
        <div className="ws-float mx-auto mb-6 grid h-20 w-20 place-items-center rounded-3xl text-white shadow-lg" style={{ background: "var(--ws-grad)" }}>
          <Wand2 className="h-9 w-9" aria-hidden="true" />
        </div>
        <h2 className="ws-h1 text-balance">Let&apos;s build your first site</h2>
        <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-muted">
          Answer a few simple questions and watch your website appear in front of you. It takes about
          two minutes.
        </p>
        <div className="mt-8 flex justify-center">
          <LinkButton href="/dashboard/new" size="lg">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
            Start the guided builder
          </LinkButton>
        </div>
      </div>
    </div>
  );
}
