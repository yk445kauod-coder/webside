"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Check } from "lucide-react";

const TEMPLATES = [
  { key: "restaurant", label: "Restaurant", cls: "sm:-rotate-3 sm:translate-y-8" },
  { key: "jewellery", label: "Jewellery", cls: "sm:z-10 sm:scale-110" },
  { key: "gym", label: "Gym", cls: "sm:rotate-3 sm:translate-y-8" },
];

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

        <motion.div {...rise(5)} className="mx-auto mt-14 grid max-w-4xl grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-6">
          {TEMPLATES.map((t) => (
            <figure
              key={t.key}
              className={
                "overflow-hidden rounded-2xl border border-[#152137]/10 bg-white text-start shadow-[0_24px_60px_-24px_rgba(21,33,55,0.35)] " +
                t.cls
              }
            >
              <div className="flex items-center gap-1.5 border-b border-[#152137]/10 bg-[#F4F1EC] px-3 py-2" aria-hidden="true">
                <i className="h-2 w-2 rounded-full bg-[#FD6B47]/70" />
                <i className="h-2 w-2 rounded-full bg-[#152137]/20" />
                <i className="h-2 w-2 rounded-full bg-[#152137]/20" />
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/templates/premium/${t.key}/thumb.png`}
                alt={`${t.label} website template`}
                loading="lazy"
                className="aspect-[4/3] w-full object-cover object-top"
              />
              <figcaption className="px-4 py-3 text-sm font-semibold text-[#152137]">{t.label}</figcaption>
            </figure>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
