import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { LinkButton } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "WebSide — Your web. Your side.",
};

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="border-b border-line bg-surface/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link href="/" aria-label="WebSide home">
            <Wordmark className="text-2xl" />
          </Link>
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-3 py-2 text-sm font-medium text-ink hover:text-cobalt"
            >
              Sign in
            </Link>
            <LinkButton href="/signup" size="sm">
              Start building
            </LinkButton>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-5xl px-6 pt-20 pb-16 text-center sm:pt-28">
          <p className="ws-eyebrow mb-5">A calmer website builder</p>
          <h1 className="ws-display mx-auto max-w-3xl text-balance">
            Your web. <span className="text-cobalt">Your side.</span>
          </h1>
          <p className="ws-lede mx-auto mt-6 max-w-xl">
            Design a site you actually control. Preview every change as you
            make it, save the versions you love, and hand the exact one you
            want to the person who publishes it. No templates-by-numbers, no
            lock-in, no noise.
          </p>
          <div className="mt-9 flex items-center justify-center gap-3">
            <LinkButton href="/signup" size="lg">
              Start building — it&apos;s free
            </LinkButton>
            <LinkButton href="/login" variant="outline" size="lg">
              Sign in
            </LinkButton>
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-line bg-surface">
          <div className="mx-auto grid max-w-5xl gap-10 px-6 py-16 sm:grid-cols-3">
            {[
              {
                n: "01",
                t: "Design",
                d: "Pick a starting point and shape it block by block. Text, images, buttons, columns — your content, your arrangement.",
              },
              {
                n: "02",
                t: "Save & submit",
                d: "Snapshot the exact version you want. The submitted version is frozen — it can’t drift from what the reviewer sees.",
              },
              {
                n: "03",
                t: "Publish",
                d: "Your site is reviewed as-is and published outside WebSide. Then the verified public URL comes back and lives in SUDO.",
              },
            ].map((s) => (
              <div key={s.n} className="flex flex-col gap-2">
                <span className="font-mono text-sm text-cobalt">{s.n}</span>
                <h3 className="ws-h2">{s.t}</h3>
                <p className="text-[15px] leading-relaxed text-muted">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Principles */}
        <section className="mx-auto max-w-5xl px-6 py-16">
          <p className="ws-eyebrow mb-3">The WebSide promise</p>
          <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {[
              ["Exact versions", "What you submit is exactly what gets reviewed. Revisions are immutable snapshots, not pointers."],
              ["Precise tools", "A deliberate block editor, sharp typography and calm surfaces. You stay in control of the result."],
              ["Zero-budget start", "Free to start, free to build. No paid add-ons required to get your first site live."],
              ["You keep the web", "WebSide helps you build and review — your site, your side."],
            ].map(([t, d]) => (
              <div key={t} className="flex gap-4 rounded-xl border border-line bg-surface p-5">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-apricot" />
                <div>
                  <h3 className="font-semibold text-ink">{t}</h3>
                  <p className="mt-1 text-[15px] leading-relaxed text-muted">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-line bg-ink text-white">
          <div className="mx-auto max-w-5xl px-6 py-16 text-center">
            <h2 className="ws-h1 text-balance">
              Build something that&apos;s yours.
            </h2>
            <p className="mx-auto mt-3 max-w-md text-white/70">
              Create your account and make the web work on your side.
            </p>
            <div className="mt-7">
              <LinkButton href="/signup" size="lg" variant="primary">
                Start building free
              </LinkButton>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Wordmark variant="mono-ink" compact />
          <p className="text-xs text-muted">Your web. Your side.</p>
        </div>
      </footer>
    </div>
  );
}