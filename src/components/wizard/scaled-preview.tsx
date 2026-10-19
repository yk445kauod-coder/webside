"use client";

import { useEffect, useRef, useState } from "react";
import type { AnyBlock } from "@/lib/types/blocks";
import { PreviewCanvas } from "@/components/preview/preview-canvas";

const DESKTOP_WIDTH = 1100;

/**
 * Renders blocks at a real desktop width and scales the result down to fit
 * its container, so a small preview panel still looks like the finished site.
 */
export function ScaledPreview({
  blocks,
  title,
}: {
  blocks: AnyBlock[];
  title: string;
}) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  const [height, setHeight] = useState(600);

  useEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    const measure = () => {
      const s = Math.min(1, o.clientWidth / DESKTOP_WIDTH);
      setScale(s);
      setHeight(i.offsetHeight * s);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(o);
    ro.observe(i);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={outer} className="relative w-full overflow-hidden rounded-2xl bg-white">
      <div style={{ height }}>
        <div
          ref={inner}
          style={{
            width: DESKTOP_WIDTH,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          <PreviewCanvas blocks={blocks} title={title} framed className="rounded-none border-0 shadow-none" />
        </div>
      </div>
    </div>
  );
}
