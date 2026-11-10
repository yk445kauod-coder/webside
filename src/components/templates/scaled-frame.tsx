"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** Renders children at 1280px wide and scales them to fit the box, whatever its width. */
export function ScaledFrame({ children, width = 1280 }: { children: ReactNode; width?: number }) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.27);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () => setScale(el.clientWidth / width);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);
  return (
    <div ref={box} className="relative aspect-[4/3] w-full overflow-hidden bg-white" aria-hidden="true">
      <div
        className="pointer-events-none absolute left-0 top-0 select-none"
        style={{ width, transformOrigin: "top left", transform: `scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}
