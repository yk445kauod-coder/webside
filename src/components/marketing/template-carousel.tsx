"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** Real full-page screenshots (1440x900) of the ready-made templates. */
const SLIDES = [
  { key: "restaurant", label: "Restaurant" },
  { key: "cafe", label: "Café" },
  { key: "bakery", label: "Bakery" },
  { key: "salon", label: "Salon" },
  { key: "clinic", label: "Clinic" },
  { key: "gym", label: "Gym" },
  { key: "shop", label: "Shop" },
  { key: "portfolio", label: "Portfolio" },
  { key: "agency", label: "Agency" },
  { key: "jewellery", label: "Jewellery" },
] as const;

const N = SLIDES.length;

/** Shortest signed distance from the active slide, wrapped around the ring. */
const offset = (i: number, active: number) => {
  let d = i - active;
  if (d > N / 2) d -= N;
  if (d < -N / 2) d += N;
  return d;
};

export function TemplateCarousel() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback((by: number) => setActive((a) => (a + by + N) % N), []);

  useEffect(() => {
    if (paused || reduce) return;
    const t = setInterval(() => go(1), 3600);
    return () => clearInterval(t);
  }, [paused, reduce, go]);

  return (
    <div
      className="relative mx-auto mt-12 w-full max-w-6xl select-none"
      role="region"
      aria-roledescription="carousel"
      aria-label="Ready-made website templates"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(1);
        if (e.key === "ArrowLeft") go(-1);
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
    >
      <div className="relative mx-auto h-[calc(min(84vw,740px)*0.625+36px)] w-full [perspective:1600px]">
        {SLIDES.map((s, i) => {
          const d = offset(i, active);
          const abs = Math.abs(d);
          return (
            <motion.figure
              key={s.key}
              aria-hidden={d !== 0}
              className="absolute left-1/2 top-0 m-0 w-[min(84vw,740px)] -translate-x-1/2 cursor-grab overflow-hidden rounded-2xl border border-[#152137]/10 bg-white shadow-[0_40px_90px_-30px_rgba(21,33,55,0.55)] active:cursor-grabbing"
              style={{ zIndex: 20 - abs, transformStyle: "preserve-3d", pointerEvents: abs > 1 ? "none" : "auto" }}
              initial={false}
              animate={{
                x: `${d * 58}%`,
                scale: d === 0 ? 1 : 0.8 - Math.min(abs, 3) * 0.04,
                rotateY: reduce ? 0 : -d * 22,
                opacity: abs > 2 ? 0 : d === 0 ? 1 : 0.55 - (abs - 1) * 0.2,
                filter: d === 0 ? "blur(0px)" : "blur(1.5px)",
              }}
              transition={{ type: "spring", stiffness: 140, damping: 22, mass: 0.9 }}
              drag={d === 0 ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.25}
              onDragEnd={(_, info) => {
                if (info.offset.x < -50) go(1);
                else if (info.offset.x > 50) go(-1);
              }}
              onClick={() => d !== 0 && setActive(i)}
            >
              <div className="flex items-center gap-1.5 border-b border-[#152137]/10 bg-[#F4F1EC] px-3 py-2" aria-hidden="true">
                <i className="h-2 w-2 rounded-full bg-[#FD6B47]/80" />
                <i className="h-2 w-2 rounded-full bg-[#152137]/20" />
                <i className="h-2 w-2 rounded-full bg-[#152137]/20" />
                <span className="ms-3 hidden h-4 flex-1 rounded-full bg-white/80 sm:block" />
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/templates/premium/${s.key}/thumb.png`}
                alt={`${s.label} website template`}
                width={1440}
                height={900}
                draggable={false}
                loading={abs <= 1 ? "eager" : "lazy"}
                decoding="async"
                className="block aspect-[16/10] w-full object-cover object-top"
              />
            </motion.figure>
          );
        })}
      </div>

      <div className="mt-8 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Previous template"
          className="grid h-10 w-10 place-items-center rounded-full border border-[#152137]/15 bg-white text-[#152137] transition hover:border-[#FD6B47] hover:text-[#FD6B47]"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm font-semibold text-[#152137]" aria-live="polite">
            {SLIDES[active].label}
          </p>
          <div className="flex gap-1.5" role="tablist" aria-label="Choose template">
            {SLIDES.map((s, i) => (
              <button
                key={s.key}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-label={s.label}
                onClick={() => setActive(i)}
                className={
                  "h-1.5 rounded-full transition-all duration-300 " +
                  (i === active ? "w-6 bg-[#FD6B47]" : "w-1.5 bg-[#152137]/20 hover:bg-[#152137]/40")
                }
              />
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Next template"
          className="grid h-10 w-10 place-items-center rounded-full border border-[#152137]/15 bg-white text-[#152137] transition hover:border-[#FD6B47] hover:text-[#FD6B47]"
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
