import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  Check,
  HeartHandshake,
  Monitor,
  Palette,
  PartyPopper,
  PenLine,
  Rocket,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Tablet,
  UtensilsCrossed,
  WandSparkles,
} from "lucide-react";
import { Wordmark } from "@/components/wordmark";
import { Hero } from "@/components/marketing/hero";
import { Reveal } from "@/components/marketing/reveal";
import { buildWizardBlocks, defaultInput } from "@/lib/wizard";

export const metadata: Metadata = {
  title: "WebSide — Build a website by answering questions",
};

const TYPES = [
  { icon: Briefcase, label: "Businesses" },
  { icon: Palette, label: "Portfolios" },
  { icon: ShoppingBag, label: "Online shops" },
  { icon: UtensilsCrossed, label: "Restaurants" },
  { icon: PartyPopper, label: "Events & weddings" },
  { icon: PenLine, label: "Personal blogs" },
  { icon: Rocket, label: "Studios" },
  { icon: HeartHandshake, label: "Communities" },
];

const STEPS = [
  { n: "1", t: "Tell us what you do", d: "Pick the kind of site. We prepare smart starting words so you never face a blank page." },
  { n: "2", t: "Choose how it feels", d: "Colours, mood, sections. Every tap updates a live preview right next to you." },
  { n: "3", t: "Launch", d: "Hit one button. Your site is built, saved and ready to polish or send for review." },
];

export default function LandingPage() {
  // The product shot is the real renderer fed by the real wizard generator,
  // so it can never drift from what a new customer actually gets.
  const showcase = buildWizardBlocks({
    ...defaultInput("restaurant"),
    name: "Corner & Co.",
    slug: "corner-and-co",
    tagline: "Fresh every morning, from our kitchen to your table.",
    accent: "sunset",
    look: "spotlight",
    email: "hello@corner.co",
  });

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="ws-night fixed inset-x-0 top-0 z-30 border-b border-white/10 bg-[#1d1310]/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="WebSide home">
            <Wordmark variant="mono-white" className="text-2xl" />
          </Link>
          <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2">
            <Link href="/login" className="rounded-xl px-3 py-2 text-sm font-semibold text-white/80 transition hover:text-white">
              Sign in
            </Link>
            <Link href="/signup" className="ws-btn-grad inline-flex h-10 items-center rounded-xl px-4 text-sm font-semibold">
              Start free
            </Link>
          </nav>
        </div>
      </header>

      <main id="main" className="flex-1">
        <Hero blocks={showcase} />

        {/* Who it's for — endless marquee */}
        <section aria-label="Sites you can build" className="overflow-hidden border-b border-line bg-surface py-6">
          <div className="ws-marquee gap-4" aria-hidden="true">
            {[...TYPES, ...TYPES].map(({ icon: Icon, label }, i) => (
              <span key={i} className="mr-4 inline-flex shrink-0 items-center gap-2.5 rounded-full border border-line bg-canvas px-5 py-2.5 text-sm font-semibold text-ink">
                <Icon className="h-4 w-4 text-copper" />
                {label}
              </span>
            ))}
          </div>
          <p className="sr-only">Build sites for businesses, portfolios, shops, restaurants, events, blogs, studios and communities.</p>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6" aria-labelledby="how">
          <Reveal className="mx-auto mb-14 max-w-2xl text-center">
            <p className="ws-eyebrow mb-3">Simple on purpose</p>
            <h2 id="how" className="ws-h1 text-balance">
              Easier than sending a message.
            </h2>
          </Reveal>
          <ol className="grid gap-5 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={0.08 * i}>
                <li className="ws-card-glow relative h-full overflow-hidden p-7">
                  <span
                    aria-hidden="true"
                    className="absolute -right-2 -top-6 select-none text-[9rem] font-black leading-none text-copper/8"
                  >
                    {s.n}
                  </span>
                  <span className="relative mb-5 grid h-12 w-12 place-items-center rounded-2xl text-lg font-bold text-white" style={{ background: "var(--ws-grad)" }}>
                    {s.n}
                  </span>
                  <h3 className="relative text-xl font-semibold tracking-tight">{s.t}</h3>
                  <p className="relative mt-2 text-[15px] leading-relaxed text-muted">{s.d}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </section>

        {/* Bento */}
        <section className="border-y border-line bg-surface" aria-labelledby="why">
          <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
            <Reveal className="mx-auto mb-14 max-w-2xl text-center">
              <p className="ws-eyebrow mb-3">Made for everyone</p>
              <h2 id="why" className="ws-h1 text-balance">
                Everything you need. Nothing you don&apos;t.
              </h2>
            </Reveal>

            <div className="grid gap-5 md:grid-cols-6">
              <Reveal className="md:col-span-4">
                <article className="relative h-full overflow-hidden rounded-3xl p-8 text-white" style={{ background: "var(--ws-grad)" }}>
                  <div aria-hidden="true" className="ws-dots absolute inset-0 opacity-60" />
                  <WandSparkles className="relative mb-5 h-9 w-9" aria-hidden="true" />
                  <h3 className="relative max-w-sm text-2xl font-semibold tracking-tight">A guide, not a blank page</h3>
                  <p className="relative mt-2 max-w-md text-white/85">
                    One question at a time, with smart suggestions. If you can answer a message, you can build a website.
                  </p>
                  <div className="relative mt-7 flex flex-wrap gap-2" aria-hidden="true">
                    {["Type", "Name", "Look", "Details", "Sections", "Launch"].map((t, i) => (
                      <span key={t} className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold backdrop-blur">
                        <Check className="h-3.5 w-3.5" />
                        {i + 1}. {t}
                      </span>
                    ))}
                  </div>
                </article>
              </Reveal>

              <Reveal delay={0.08} className="md:col-span-2">
                <article className="h-full rounded-3xl border border-line bg-canvas p-8">
                  <div aria-hidden="true" className="mb-6 flex gap-2">
                    {["#b5482a", "#f2603f", "#1f8f63", "#1c7ed6", "#e0378a"].map((c) => (
                      <span key={c} className="h-9 w-9 rounded-full shadow-inner" style={{ background: c }} />
                    ))}
                  </div>
                  <h3 className="text-xl font-semibold tracking-tight">Colour in one tap</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted">Pick a palette and a mood. The whole site follows.</p>
                </article>
              </Reveal>

              <Reveal delay={0.04} className="md:col-span-2">
                <article className="h-full rounded-3xl border border-line bg-canvas p-8">
                  <div aria-hidden="true" className="mb-6 flex items-end gap-3 text-copper">
                    <Smartphone className="h-8 w-8" />
                    <Tablet className="h-10 w-10" />
                    <Monitor className="h-12 w-12" />
                  </div>
                  <h3 className="text-xl font-semibold tracking-tight">Looks right everywhere</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted">Phones, tablets and big screens, handled for you.</p>
                </article>
              </Reveal>

              <Reveal delay={0.12} className="md:col-span-4">
                <article className="relative h-full overflow-hidden rounded-3xl bg-ink p-8 text-white">
                  <div aria-hidden="true" className="absolute -right-10 -top-10 h-56 w-56 rounded-full bg-copper/40 blur-3xl" />
                  <ShieldCheck className="relative mb-5 h-9 w-9 text-[#6fb7ae]" aria-hidden="true" />
                  <h3 className="relative max-w-sm text-2xl font-semibold tracking-tight">Checked before it goes live</h3>
                  <p className="relative mt-2 max-w-md text-white/75">
                    Every version you submit is frozen and reviewed exactly as you made it. What we approve is
                    exactly what you built.
                  </p>
                </article>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="ws-night relative isolate overflow-hidden">
          <div className="ws-aurora" aria-hidden="true">
            <i />
          </div>
          <Reveal className="relative z-10 mx-auto max-w-3xl px-4 py-28 text-center sm:px-6">
            <h2 className="ws-display text-balance text-white">
              Your site is <span className="ws-gradient-text">two minutes away.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-md text-lg text-white/70">
              Free to start. No credit card. Just a few questions.
            </p>
            <Link
              href="/signup"
              className="ws-btn-grad mt-9 inline-flex h-14 items-center gap-2 rounded-2xl px-9 text-base font-semibold"
            >
              Build my site free
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Wordmark variant="mono-ink" compact />
          <p className="text-xs text-muted">Your web. Your side.</p>
        </div>
      </footer>
    </div>
  );
}
