"use client";

import Link from "next/link";
import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { ArrowRight, Eye, ShieldCheck, Sparkles, Wand2 } from "lucide-react";
import { PreviewCanvas } from "@/components/preview/preview-canvas";
import type { AnyBlock } from "@/lib/types/blocks";

const fade = (i: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay: 0.12 * i, ease: [0.22, 1, 0.36, 1] as const },
});

export function Hero({ blocks }: { blocks: AnyBlock[] }) {
  const reduce = useReducedMotion();
  const stage = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [9, -9]), { stiffness: 120, damping: 16 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-12, 12]), { stiffness: 120, damping: 16 });

  function onMove(e: React.PointerEvent) {
    if (reduce || !stage.current) return;
    const r = stage.current.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  }
  function onLeave() {
    mx.set(0);
    my.set(0);
  }

  return (
    <section className="ws-night relative isolate overflow-hidden">
      <div className="ws-aurora" aria-hidden="true">
        <i />
      </div>
      <div aria-hidden="true" className="ws-dots absolute inset-0 z-0" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-24 pt-20 text-center sm:px-6 sm:pt-28">
        <motion.p
          {...fade(0)}
          className="ws-glass mx-auto mb-7 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[13px] font-medium text-white/90"
        >
          <Sparkles className="h-4 w-4 text-[#f2a65a]" aria-hidden="true" />
          Build a website by answering questions
        </motion.p>

        <motion.h1 {...fade(1)} className="ws-display mx-auto max-w-4xl text-balance text-white">
          Your website,
          <br />
          <span className="ws-gradient-text">built as you chat.</span>
        </motion.h1>

        <motion.p {...fade(2)} className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/70">
          Tell us what you do. Pick a colour you love. Watch a real website appear in front of you,
          step by step. No design skills. No code. No stress.
        </motion.p>

        <motion.div {...fade(3)} className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/signup"
            className="ws-btn-grad inline-flex h-14 items-center gap-2 rounded-2xl px-8 text-base font-semibold"
          >
            Build my site free
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
          <Link
            href="/login"
            className="ws-glass inline-flex h-14 items-center rounded-2xl px-7 text-base font-semibold text-white transition hover:bg-white/15"
          >
            I have an account
          </Link>
        </motion.div>

        <motion.ul
          {...fade(4)}
          className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/60"
        >
          <li>Free to start</li>
          <li aria-hidden="true">·</li>
          <li>No credit card</li>
          <li aria-hidden="true">·</li>
          <li>Ready in about 2 minutes</li>
        </motion.ul>

        {/* 3D product stage */}
        <motion.div
          {...fade(5)}
          ref={stage}
          onPointerMove={onMove}
          onPointerLeave={onLeave}
          className="relative mx-auto mt-16 max-w-4xl [perspective:1400px]"
        >
          <motion.div
            style={reduce ? undefined : { rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
            className="relative"
          >
            <div
              aria-hidden="true"
              className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-tr from-[#b5482a]/35 to-[#e8772e]/35 blur-3xl"
            />
            <div className="relative overflow-hidden rounded-[1.75rem] border border-white/20 bg-white text-left shadow-[0_40px_120px_-30px_rgba(181,72,42,0.55)]">
              <PreviewCanvas blocks={blocks} title="corner-and-co.webside.dev" framed className="rounded-none border-0 shadow-none" />
              <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white to-transparent" />
            </div>

            <FloatingChip className="-left-3 top-24 sm:-left-12" delay={0} icon={<Wand2 className="h-4 w-4" aria-hidden="true" />} tone="from-[#b5482a] to-[#2e7d87]">
              Guided builder
            </FloatingChip>
            <FloatingChip className="-right-3 top-44 sm:-right-12" delay={1.2} icon={<Eye className="h-4 w-4" aria-hidden="true" />} tone="from-[#e8772e] to-[#f2a65a]">
              Live preview
            </FloatingChip>
            <FloatingChip className="-left-2 bottom-24 sm:-left-8" delay={2.2} icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />} tone="from-[#1f8f63] to-[#6fb7ae]">
              Reviewed before it goes live
            </FloatingChip>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function FloatingChip({
  children,
  icon,
  tone,
  className,
  delay,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  tone: string;
  className: string;
  delay: number;
}) {
  return (
    <div
      className={`ws-float absolute z-10 hidden items-center gap-2 rounded-2xl bg-white px-3 py-2 text-[13px] font-semibold text-ink shadow-xl sm:flex ${className}`}
      style={{ animationDelay: `${delay}s`, transform: "translateZ(60px)" }}
    >
      <span className={`grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br text-white ${tone}`}>{icon}</span>
      {children}
    </div>
  );
}
