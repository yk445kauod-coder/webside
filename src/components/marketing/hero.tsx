"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Check } from "lucide-react";

/** A live, scaled-down page. Vector-sharp at any resolution, unlike a screenshot. */
function Frame({ src, title, w, h, scale }: { src: string; title: string; w: number; h: number; scale: number }) {
  return (
    <div className="relative overflow-hidden bg-white" style={{ width: w * scale, height: h * scale }}>
      <iframe
        src={src}
        title={title}
        loading="lazy"
        tabIndex={-1}
        scrolling="no"
        sandbox="allow-scripts"
        style={{ width: w, height: h, border: 0, transform: `scale(${scale})`, transformOrigin: "top left", pointerEvents: "none" }}
      />
    </div>
  );
}

const POINTS = ["Free to start", "No credit card", "Live in about 2 minutes"];

export function Hero() {
  const reduce = useReducedMotion();
  const rise = (i: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 22 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6, delay: 0.1 * i, ease: [0.22, 1, 0.36, 1] as const },
        };

  return (
    <section className="relative isolate overflow-hidden bg-[#FEFCF9]">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60rem 28rem at 85% -10%, rgba(253,107,71,0.14), transparent 60%), radial-gradient(48rem 24rem at 5% 0%, rgba(21,33,55,0.08), transparent 60%)",
        }}
      />
      <div className="mx-auto max-w-6xl px-4 pb-20 pt-20 text-center sm:px-6 sm:pt-24">
        <motion.p
          {...rise(0)}
          className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-[#152137]/10 bg-white px-4 py-1.5 text-[13px] font-semibold text-[#152137] shadow-sm"
        >
          <span className="h-2 w-2 rounded-full bg-[#FD6B47]" aria-hidden="true" />
          Your Web, Your Side
        </motion.p>

        <motion.h1
          {...rise(1)}
          className="mx-auto max-w-3xl text-balance text-[2.5rem] font-extrabold leading-[1.05] tracking-tight text-[#152137] sm:text-6xl"
        >
          A real website for your business, <span className="text-[#FD6B47]">built as you chat.</span>
        </motion.h1>

        <motion.p {...rise(2)} className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-[#152137]/70">
          Tell us what you do and pick a look. Your site appears in minutes, in Arabic or English, ready for your phone.
        </motion.p>

        <motion.div {...rise(3)} className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#FD6B47] px-8 text-base font-semibold text-white shadow-[0_10px_30px_-8px_rgba(253,107,71,0.7)] transition hover:bg-[#f25a35] sm:w-auto"
          >
            Build my site free
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
          <Link
            href="/login"
            className="inline-flex h-14 w-full items-center justify-center rounded-2xl border border-[#152137]/15 bg-white px-7 text-base font-semibold text-[#152137] transition hover:border-[#152137]/40 sm:w-auto"
          >
            I have an account
          </Link>
        </motion.div>

        <motion.ul
          {...rise(4)}
          className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-sm text-[#152137]/60"
        >
          {POINTS.map((p) => (
            <li key={p} className="inline-flex items-center gap-1.5">
              <Check className="h-4 w-4 text-[#FD6B47]" aria-hidden="true" />
              {p}
            </li>
          ))}
        </motion.ul>

        <motion.div {...rise(5)} className="relative mx-auto mt-14 flex max-w-5xl items-end justify-center px-2">
          <div className="hidden overflow-hidden rounded-t-2xl border-[10px] border-b-0 border-[#152137] bg-[#152137] shadow-[0_40px_80px_-30px_rgba(21,33,55,0.55)] sm:block">
            <Frame src="/templates/premium/restaurant/index.html" title="Restaurant template" w={1280} h={800} scale={0.5} />
          </div>
          <div className="overflow-hidden rounded-[2rem] border-[8px] border-[#152137] bg-[#152137] shadow-[0_30px_70px_-25px_rgba(21,33,55,0.6)] sm:-ms-10">
            <div className="sm:hidden">
              <Frame src="/templates/premium/jewellery/index.html" title="Jewellery template" w={390} h={780} scale={0.7} />
            </div>
            <div className="hidden sm:block">
              <Frame src="/templates/premium/jewellery/index.html" title="Jewellery template" w={390} h={780} scale={0.5} />
            </div>
          </div>
        </motion.div>
        <p className="mt-6 text-sm text-[#152137]/55">Real templates, running live. Pick one and make it yours.</p>
      </div>
    </section>
  );
}
