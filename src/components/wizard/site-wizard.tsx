"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Check,
  Eye,
  HeartHandshake,
  Palette,
  PartyPopper,
  PenLine,
  Rocket,
  ShoppingBag,
  Sparkles,
  UtensilsCrossed,
  WandSparkles,
  X,
  type LucideIcon,
} from "lucide-react";
import { Wordmark } from "@/components/wordmark";
import { ScaledPreview } from "@/components/wizard/scaled-preview";
import { createSiteFromWizard } from "@/app/dashboard/actions";
import { cn, slugify } from "@/lib/utils";
import { LIMITS } from "@/lib/limits";
import {
  ACCENTS,
  ACCENT_META,
  LOOKS,
  LOOK_META,
  SECTION_KEYS,
  SITE_TYPES,
  TYPE_PRESETS,
  buildWizardBlocks,
  defaultInput,
  type SectionKey,
  type SiteType,
  type WizardInput,
} from "@/lib/wizard";

const TYPE_ICONS: Record<SiteType, { icon: LucideIcon; grad: string }> = {
  business: { icon: Briefcase, grad: "from-indigo-500 to-blue-500" },
  portfolio: { icon: Palette, grad: "from-fuchsia-500 to-pink-500" },
  shop: { icon: ShoppingBag, grad: "from-orange-500 to-amber-400" },
  restaurant: { icon: UtensilsCrossed, grad: "from-rose-500 to-orange-400" },
  event: { icon: PartyPopper, grad: "from-violet-500 to-fuchsia-500" },
  personal: { icon: PenLine, grad: "from-emerald-500 to-teal-400" },
  agency: { icon: Rocket, grad: "from-blue-500 to-cyan-400" },
  nonprofit: { icon: HeartHandshake, grad: "from-pink-500 to-rose-400" },
};

const SECTION_META: Record<SectionKey, { label: string; hint: string }> = {
  about: { label: "About", hint: "A short intro about you" },
  offerings: { label: "What you offer", hint: "Three highlights in cards" },
  quote: { label: "Testimonial", hint: "A line from a happy customer" },
  cta: { label: "Main button", hint: "One clear thing to do" },
  contact: { label: "Contact", hint: "How people reach you" },
};

const STEPS = ["Type", "Name", "Look", "Details", "Sections", "Launch"] as const;

const inputClass =
  "w-full rounded-2xl border border-line bg-white px-4 py-3 text-[15px] text-ink shadow-ws-sm " +
  "outline-none transition placeholder:text-muted/60 focus:border-cobalt focus:ring-4 focus:ring-cobalt/15";

export function SiteWizard() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [input, setInput] = useState<WizardInput>(() => defaultInput("business"));
  const [slugTouched, setSlugTouched] = useState(false);
  const [detailsTouched, setDetailsTouched] = useState(false);
  const [typeChosen, setTypeChosen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const blocks = useMemo(() => buildWizardBlocks(input), [input]);
  const set = (patch: Partial<WizardInput>) => setInput((prev) => ({ ...prev, ...patch }));

  function chooseType(type: SiteType) {
    setTypeChosen(true);
    setInput((prev) => {
      const next = defaultInput(type);
      return detailsTouched
        ? { ...prev, type }
        : { ...next, name: prev.name, slug: prev.slug, email: prev.email, accent: prev.accent, look: prev.look };
    });
    // Choosing a type is the whole step, so move on right away.
    window.setTimeout(() => go(1), 260);
  }

  function setName(name: string) {
    set({ name, ...(slugTouched ? {} : { slug: slugify(name) }) });
  }

  const canNext = [
    typeChosen,
    input.name.trim().length > 0,
    true,
    input.tagline.trim().length > 0,
    input.sections.length > 0,
    true,
  ][step];

  function go(delta: 1 | -1) {
    setDir(delta);
    setStep((s) => Math.min(STEPS.length - 1, Math.max(0, s + delta)));
    rootRef.current?.scrollTo({ top: 0 });
  }

  async function launch() {
    if (launching) return;
    setLaunching(true);
    setError(null);
    const result = await createSiteFromWizard({
      ...input,
      slug: input.slug || slugify(input.name),
    });
    if (result.error || !result.slug) {
      setError(result.error ?? "Couldn't create your site. Please try again.");
      setLaunching(false);
      if (result.error?.includes("address")) {
        setDir(-1);
        setStep(1);
      }
      return;
    }
    if (!reduce) {
      const { default: confetti } = await import("canvas-confetti");
      const burst = (x: number) =>
        confetti({
          particleCount: 90,
          spread: 75,
          startVelocity: 48,
          origin: { x, y: 0.7 },
          colors: ["#6d4cff", "#3b82f6", "#ff5fa2", "#ffc46b", "#ffffff"],
        });
      burst(0.2);
      burst(0.8);
    }
    window.setTimeout(() => router.push(`/dashboard/sites/${result.slug}`), reduce ? 0 : 1100);
  }

  const previewTitle = `${input.slug || "your-site"}.webside.dev`;

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-canvas"
      onKeyDown={(e) => {
        const tag = (e.target as HTMLElement).tagName;
        if (e.key === "Enter" && tag === "INPUT" && canNext && step < STEPS.length - 1 && step !== 0) {
          e.preventDefault();
          go(1);
        }
      }}
    >
      {/* soft background glow */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-cobalt/15 blur-3xl" />
        <div className="absolute -right-40 top-1/3 h-[30rem] w-[30rem] rounded-full bg-[#ff5fa2]/15 blur-3xl" />
      </div>

      <header className="relative z-10 flex items-center justify-between gap-4 px-4 py-4 sm:px-8">
        <Link href="/dashboard" aria-label="WebSide dashboard">
          <Wordmark compact />
        </Link>

        <ol className="hidden items-center gap-1.5 md:flex" aria-label="Progress">
          {STEPS.map((label, i) => (
            <li key={label} className="flex items-center gap-1.5" aria-current={i === step ? "step" : undefined}>
              <span
                className={cn(
                  "flex h-7 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-all",
                  i === step && "bg-ink text-white shadow-ws-sm",
                  i < step && "bg-cobalt-soft text-cobalt",
                  i > step && "text-muted",
                )}
              >
                {i < step ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <span>{i + 1}</span>}
                {label}
              </span>
              {i < STEPS.length - 1 ? <span aria-hidden="true" className="h-px w-3 bg-line" /> : null}
            </li>
          ))}
        </ol>
        <p className="text-xs font-semibold text-muted md:hidden" aria-live="polite">
          Step {step + 1} of {STEPS.length}
        </p>

        <Link
          href="/dashboard"
          aria-label="Exit the wizard"
          className="grid h-9 w-9 place-items-center rounded-full text-muted transition hover:bg-ink-soft hover:text-ink"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </Link>
      </header>

      {/* progress bar */}
      <div aria-hidden="true" className="relative z-10 mx-4 h-1 overflow-hidden rounded-full bg-ink-soft sm:mx-8">
        <motion.div
          className="h-full rounded-full"
          style={{ background: "var(--ws-grad)" }}
          animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          transition={{ type: "spring", stiffness: 140, damping: 22 }}
        />
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-7xl flex-1 gap-8 px-4 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:py-10">
        {/* ---------------- left: the questions ---------------- */}
        <div className="flex min-w-0 flex-col">
          <div className="relative flex-1">
            <AnimatePresence mode="wait" custom={dir} initial={false}>
              <motion.section
                key={step}
                custom={dir}
                initial={reduce ? false : { opacity: 0, x: dir * 36 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduce ? undefined : { opacity: 0, x: dir * -36 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                aria-labelledby="wiz-title"
              >
                {step === 0 ? (
                  <StepType value={input.type} chosen={typeChosen} onChoose={chooseType} />
                ) : null}
                {step === 1 ? (
                  <StepName
                    name={input.name}
                    slug={input.slug}
                    onName={setName}
                    onSlug={(v) => {
                      setSlugTouched(true);
                      set({ slug: slugify(v) });
                    }}
                  />
                ) : null}
                {step === 2 ? <StepLook input={input} onChange={set} /> : null}
                {step === 3 ? (
                  <StepDetails
                    input={input}
                    onChange={(patch) => {
                      setDetailsTouched(true);
                      set(patch);
                    }}
                  />
                ) : null}
                {step === 4 ? <StepSections input={input} onChange={set} /> : null}
                {step === 5 ? <StepLaunch input={input} error={error} /> : null}
              </motion.section>
            </AnimatePresence>
          </div>

          {/* nav */}
          <div className="sticky bottom-0 -mx-4 mt-8 flex items-center justify-between gap-3 border-t border-line bg-canvas/85 px-4 py-4 backdrop-blur sm:-mx-8 sm:px-8 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:backdrop-blur-none">
            <button
              type="button"
              onClick={() => go(-1)}
              disabled={step === 0 || launching}
              className="inline-flex h-12 items-center gap-2 rounded-2xl px-4 text-sm font-semibold text-ink transition hover:bg-ink-soft disabled:pointer-events-none disabled:opacity-0"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="inline-flex h-12 items-center gap-2 rounded-2xl border border-line bg-white px-4 text-sm font-semibold text-ink shadow-ws-sm lg:hidden"
              >
                <Eye className="h-4 w-4" aria-hidden="true" />
                Preview
              </button>

              {step < STEPS.length - 1 ? (
                step === 0 && !typeChosen ? null : (
                  <button
                    type="button"
                    onClick={() => go(1)}
                    disabled={!canNext}
                    className="ws-btn-grad inline-flex h-12 items-center gap-2 rounded-2xl px-6 text-[15px] font-semibold disabled:pointer-events-none disabled:opacity-40"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                )
              ) : (
                <button
                  type="button"
                  onClick={launch}
                  disabled={launching}
                  className="ws-btn-grad ws-pulse-ring inline-flex h-12 items-center gap-2 rounded-2xl px-7 text-[15px] font-semibold disabled:pointer-events-none disabled:opacity-70"
                >
                  {launching ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden="true" />
                  ) : (
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                  )}
                  {launching ? "Building your site…" : "Create my site"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ---------------- right: live preview (desktop) ---------------- */}
        <aside className="hidden min-w-0 lg:block" aria-label="Live preview">
          <div className="sticky top-6">
            <div className="mb-3 flex items-center justify-between px-1">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                </span>
                Live preview
              </p>
              <p className="text-xs text-muted">Updates as you type</p>
            </div>
            <div className="rounded-[28px] border border-white bg-white/60 p-2 shadow-ws backdrop-blur">
              <div className="max-h-[calc(100vh-11rem)] overflow-y-auto rounded-3xl ws-scroll">
                <ScaledPreview blocks={blocks} title={previewTitle} />
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* mobile preview sheet */}
      <AnimatePresence>
        {previewOpen ? (
          <motion.div
            className="fixed inset-0 z-[60] flex flex-col bg-canvas lg:hidden"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            role="dialog"
            aria-modal="true"
            aria-label="Site preview"
          >
            <div className="flex items-center justify-between px-4 py-3">
              <p className="text-sm font-semibold">Your site, live</p>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-full bg-ink-soft"
                aria-label="Close preview"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 pb-6">
              <ScaledPreview blocks={blocks} title={previewTitle} />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/* ====================================================================== */
/* Steps                                                                    */
/* ====================================================================== */

function Title({ eyebrow, title, sub }: { eyebrow: string; title: string; sub: string }) {
  return (
    <div className="mb-7">
      <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-cobalt-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-cobalt">
        <WandSparkles className="h-3.5 w-3.5" aria-hidden="true" />
        {eyebrow}
      </p>
      <h1 id="wiz-title" className="ws-h1 text-balance">
        {title}
      </h1>
      <p className="mt-2 max-w-md text-[15px] leading-relaxed text-muted">{sub}</p>
    </div>
  );
}

function StepType({
  value,
  chosen,
  onChoose,
}: {
  value: SiteType;
  chosen: boolean;
  onChoose: (t: SiteType) => void;
}) {
  return (
    <>
      <Title
        eyebrow="Let’s start"
        title="What are you building?"
        sub="Pick the closest match. We will fill in smart starting content, and you can change every word."
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {SITE_TYPES.map((t, i) => {
          const { icon: Icon, grad } = TYPE_ICONS[t];
          const active = chosen && value === t;
          return (
            <motion.button
              key={t}
              type="button"
              aria-pressed={active}
              data-active={active}
              onClick={() => onChoose(t)}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * i, duration: 0.3 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="ws-card-glow flex flex-col items-start gap-3 p-4 text-left"
            >
              <span className={cn("grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-lg", grad)}>
                <Icon className="h-6 w-6" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-[15px] font-semibold text-ink">{TYPE_PRESETS[t].label}</span>
                <span className="mt-0.5 block text-xs leading-snug text-muted">{TYPE_PRESETS[t].hint}</span>
              </span>
            </motion.button>
          );
        })}
      </div>
    </>
  );
}

function StepName({
  name,
  slug,
  onName,
  onSlug,
}: {
  name: string;
  slug: string;
  onName: (v: string) => void;
  onSlug: (v: string) => void;
}) {
  return (
    <>
      <Title
        eyebrow="Your identity"
        title="What should we call it?"
        sub="This becomes the big title at the top of your site. Short and memorable wins."
      />
      <label className="mb-1.5 block text-sm font-semibold text-ink" htmlFor="wiz-name">
        Site name
      </label>
      <input
        id="wiz-name"
        autoFocus
        value={name}
        onChange={(e) => onName(e.target.value)}
        maxLength={80}
        placeholder="Corner & Co."
        className={cn(inputClass, "h-16 text-xl font-semibold tracking-tight")}
      />

      <label className="mb-1.5 mt-6 block text-sm font-semibold text-ink" htmlFor="wiz-slug">
        Site address
      </label>
      <div className="flex items-center overflow-hidden rounded-2xl border border-line bg-white shadow-ws-sm focus-within:border-cobalt focus-within:ring-4 focus-within:ring-cobalt/15">
        <input
          id="wiz-slug"
          value={slug}
          onChange={(e) => onSlug(e.target.value)}
          maxLength={48}
          placeholder="corner-and-co"
          className="min-w-0 flex-1 bg-transparent px-4 py-3 font-mono text-[15px] outline-none"
        />
        <span className="border-l border-line bg-ink-soft/60 px-4 py-3 font-mono text-sm text-muted">.webside.dev</span>
      </div>
      <p className="mt-2 text-xs text-muted">We made this from your name. You can change it now or later.</p>
    </>
  );
}

function StepLook({
  input,
  onChange,
}: {
  input: WizardInput;
  onChange: (p: Partial<WizardInput>) => void;
}) {
  return (
    <>
      <Title
        eyebrow="Make it yours"
        title="Pick a vibe"
        sub="Choose a colour and a mood. Watch the preview change as you go."
      />

      <p className="mb-2 text-sm font-semibold text-ink">Colour</p>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {ACCENTS.map((a) => {
          const active = input.accent === a;
          return (
            <button
              key={a}
              type="button"
              aria-pressed={active}
              onClick={() => onChange({ accent: a })}
              className={cn(
                "group flex flex-col items-center gap-2 rounded-2xl border bg-white p-3 transition",
                active ? "border-cobalt ring-4 ring-cobalt/15" : "border-line hover:border-ink/25",
              )}
            >
              <span
                className="relative grid h-11 w-11 place-items-center rounded-full shadow-inner transition group-hover:scale-110"
                style={{ background: ACCENT_META[a].swatch }}
              >
                {active ? <Check className="ws-pop h-5 w-5 text-white" aria-hidden="true" /> : null}
              </span>
              <span className="text-xs font-semibold text-ink">{ACCENT_META[a].label}</span>
            </button>
          );
        })}
      </div>

      <p className="mb-2 mt-7 text-sm font-semibold text-ink">Mood</p>
      <div className="grid gap-3 sm:grid-cols-3">
        {LOOKS.map((l) => {
          const active = input.look === l;
          return (
            <button
              key={l}
              type="button"
              aria-pressed={active}
              data-active={active}
              onClick={() => onChange({ look: l })}
              className="ws-card-glow flex flex-col gap-3 p-3 text-left"
            >
              <LookThumb look={l} />
              <span>
                <span className="block text-sm font-semibold text-ink">{LOOK_META[l].label}</span>
                <span className="block text-xs text-muted">{LOOK_META[l].hint}</span>
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

function LookThumb({ look }: { look: "spotlight" | "airy" | "bold" }) {
  const dark = look === "spotlight";
  const tint = look === "bold";
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-20 w-full flex-col justify-center gap-1.5 overflow-hidden rounded-xl px-3",
        dark && "bg-ink items-center",
        tint && "bg-cobalt-soft items-center",
        look === "airy" && "border border-line bg-white items-start",
      )}
    >
      <span className={cn("h-2.5 w-2/3 rounded-full", dark ? "bg-white" : "bg-ink")} />
      <span className={cn("h-1.5 w-1/2 rounded-full", dark ? "bg-white/50" : "bg-ink/30")} />
      <span className="mt-1 h-3 w-10 rounded-md bg-cobalt" />
    </span>
  );
}

function StepDetails({
  input,
  onChange,
}: {
  input: WizardInput;
  onChange: (p: Partial<WizardInput>) => void;
}) {
  const preset = TYPE_PRESETS[input.type];
  const setOffering = (i: number, patch: Partial<{ heading: string; text: string }>) =>
    onChange({
      offerings: input.offerings.map((o, idx) => (idx === i ? { ...o, ...patch } : o)),
    });

  return (
    <>
      <Title
        eyebrow="Your words"
        title="Tell us a little"
        sub="We wrote a draft for you. Keep it, tweak it, or write your own."
      />

      <label className="mb-1.5 block text-sm font-semibold text-ink" htmlFor="wiz-tagline">
        One-line tagline
      </label>
      <input
        id="wiz-tagline"
        value={input.tagline}
        onChange={(e) => onChange({ tagline: e.target.value })}
        maxLength={LIMITS.heroSubtitle}
        className={inputClass}
      />
      <div className="mt-2 flex flex-wrap gap-2">
        {preset.taglines.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onChange({ tagline: t })}
            className="rounded-full border border-line bg-white px-3 py-1 text-xs text-muted transition hover:border-cobalt hover:text-cobalt"
          >
            {t}
          </button>
        ))}
      </div>

      <label className="mb-1.5 mt-6 block text-sm font-semibold text-ink" htmlFor="wiz-about">
        {preset.aboutLabel}
      </label>
      <textarea
        id="wiz-about"
        rows={4}
        value={input.about}
        onChange={(e) => onChange({ about: e.target.value })}
        maxLength={LIMITS.paragraph}
        className={cn(inputClass, "resize-none leading-relaxed")}
      />

      <p className="mb-2 mt-6 text-sm font-semibold text-ink">{preset.offeringsHeading}</p>
      <div className="grid gap-3">
        {input.offerings.map((o, i) => (
          <div key={i} className="rounded-2xl border border-line bg-white p-3 shadow-ws-sm">
            <input
              aria-label={`Highlight ${i + 1} title`}
              value={o.heading}
              onChange={(e) => setOffering(i, { heading: e.target.value })}
              maxLength={LIMITS.columnHeading}
              className="w-full bg-transparent px-1 pb-1 text-[15px] font-semibold outline-none"
            />
            <input
              aria-label={`Highlight ${i + 1} description`}
              value={o.text}
              onChange={(e) => setOffering(i, { text: e.target.value })}
              maxLength={LIMITS.columnText}
              className="w-full bg-transparent px-1 text-sm text-muted outline-none"
            />
          </div>
        ))}
      </div>

      <label className="mb-1.5 mt-6 block text-sm font-semibold text-ink" htmlFor="wiz-email">
        Contact email <span className="font-normal text-muted">(optional)</span>
      </label>
      <input
        id="wiz-email"
        type="email"
        autoComplete="email"
        value={input.email}
        onChange={(e) => onChange({ email: e.target.value })}
        placeholder="hello@yourbusiness.com"
        maxLength={120}
        className={inputClass}
      />
    </>
  );
}

function StepSections({
  input,
  onChange,
}: {
  input: WizardInput;
  onChange: (p: Partial<WizardInput>) => void;
}) {
  const toggle = (k: SectionKey) =>
    onChange({
      sections: input.sections.includes(k)
        ? input.sections.filter((s) => s !== k)
        : SECTION_KEYS.filter((s) => s === k || input.sections.includes(s)),
    });

  return (
    <>
      <Title
        eyebrow="Build it out"
        title="What goes on the page?"
        sub="Switch sections on or off. The headline and footer are always there."
      />
      <ul className="grid gap-3">
        {SECTION_KEYS.map((k) => {
          const on = input.sections.includes(k);
          return (
            <li key={k}>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                onClick={() => toggle(k)}
                data-active={on}
                className="ws-card-glow flex w-full items-center gap-4 p-4 text-left"
              >
                <span
                  className={cn(
                    "grid h-11 w-11 shrink-0 place-items-center rounded-xl transition",
                    on ? "bg-cobalt text-white" : "bg-ink-soft text-muted",
                  )}
                >
                  {on ? <Check className="ws-pop h-5 w-5" aria-hidden="true" /> : <span className="h-2 w-2 rounded-full bg-muted/50" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold text-ink">{SECTION_META[k].label}</span>
                  <span className="block text-sm text-muted">{SECTION_META[k].hint}</span>
                </span>
                <span
                  aria-hidden="true"
                  className={cn("relative h-7 w-12 shrink-0 rounded-full transition", on ? "bg-cobalt" : "bg-ink/15")}
                >
                  <span
                    className={cn(
                      "absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all",
                      on ? "left-6" : "left-1",
                    )}
                  />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function StepLaunch({ input, error }: { input: WizardInput; error: string | null }) {
  const rows: [string, string][] = [
    ["Type", TYPE_PRESETS[input.type].label],
    ["Name", input.name || "—"],
    ["Address", `${input.slug || "your-site"}.webside.dev`],
    ["Colour", ACCENT_META[input.accent].label],
    ["Sections", `${input.sections.length} on`],
  ];
  return (
    <>
      <Title
        eyebrow="Almost there"
        title="Ready to see it?"
        sub="We will build your site, then open the editor so you can polish anything. Nothing is public until you submit it."
      />
      <dl className="overflow-hidden rounded-2xl border border-line bg-white shadow-ws-sm">
        {rows.map(([k, v], i) => (
          <div key={k} className={cn("flex items-center justify-between gap-4 px-5 py-3.5", i > 0 && "border-t border-line")}>
            <dt className="text-sm text-muted">{k}</dt>
            <dd className="truncate text-sm font-semibold text-ink">{v}</dd>
          </div>
        ))}
      </dl>
      {error ? (
        <p role="alert" className="mt-4 rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </>
  );
}
