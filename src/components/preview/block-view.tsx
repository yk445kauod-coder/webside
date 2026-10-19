import type { AnyBlock, BlockStyle } from "@/lib/types/blocks";
import { isExternalHref, safeHref, safeImageSrc } from "@/lib/safe-url";
import { cn } from "@/lib/utils";

const styleClasses: Record<BlockStyle, string> = {
  light: "bg-white text-ink",
  tint: "bg-cobalt-soft text-ink",
  ink: "bg-ink text-white",
};

// Secondary text must stay legible on every background (the old fixed
// `text-ink/70` was nearly invisible on the dark "ink" style).
const mutedClasses: Record<BlockStyle, string> = {
  light: "text-ink/70",
  tint: "text-ink/70",
  ink: "text-white/75",
};

const sectionPadding = "px-6 py-14 sm:px-10 md:px-16 md:py-20";

function UnknownBlock() {
  return (
    <section className={cn(sectionPadding, "bg-ink-soft/50")}>
      <p className="text-sm text-muted">
        This block type is not supported in this view.
      </p>
    </section>
  );
}

export function BlockView({ block }: { block: AnyBlock }) {
  // Scope the accent tokens to this block so each section can carry the site's colour.
  return (
    <div data-accent={block.accent && block.accent !== "indigo" ? block.accent : undefined}>
      <BlockInner block={block} />
    </div>
  );
}

function BlockInner({ block }: { block: AnyBlock }) {
  switch (block.kind) {
    case "hero": {
      const centered = block.align === "center";
      const dark = block.style === "ink";
      return (
        <section
          className={cn(
            "relative isolate overflow-hidden",
            sectionPadding,
            styleClasses[block.style],
            "flex flex-col gap-5",
            centered ? "items-center text-center" : "items-start text-left",
          )}
        >
          {/* decorative colour fields, purely visual */}
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute -right-24 -top-24 -z-10 h-72 w-72 rounded-full blur-3xl",
              dark ? "bg-cobalt/50" : "bg-cobalt/20",
            )}
          />
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute -bottom-28 -left-16 -z-10 h-64 w-64 rounded-full blur-3xl",
              dark ? "bg-apricot/35" : "bg-apricot/25",
            )}
          />
          <h1 className="ws-display max-w-3xl text-balance break-words">
            {block.title}
          </h1>
          {block.subtitle ? (
            <p
              className={cn(
                "max-w-xl text-lg leading-relaxed",
                mutedClasses[block.style],
              )}
            >
              {block.subtitle}
            </p>
          ) : null}
        </section>
      );
    }

    case "heading":
      return (
        <section className={cn(sectionPadding, styleClasses[block.style], "pb-0 pt-10 md:pb-0 md:pt-12")}>
          {block.level === 2 ? (
            <h2 className="ws-h1 break-words">{block.text}</h2>
          ) : (
            <h3 className="ws-h2 break-words">{block.text}</h3>
          )}
        </section>
      );

    case "paragraph":
      return (
        <section className={cn(sectionPadding, styleClasses[block.style], "py-6 md:py-6")}>
          <p className="max-w-2xl whitespace-pre-line break-words text-[17px] leading-relaxed opacity-90">
            {block.text}
          </p>
        </section>
      );

    case "image": {
      const src = safeImageSrc(block.src);
      return (
        <section className={cn(sectionPadding, styleClasses[block.style], "py-10 md:py-10")}>
          <figure className="mx-auto max-w-3xl">
            {src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt={block.alt}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                className="aspect-[16/9] w-full rounded-xl object-cover"
              />
            ) : (
              <div className="flex aspect-[16/9] w-full items-center justify-center rounded-xl border border-dashed border-line bg-canvas">
                <span className="text-sm text-muted">No image yet</span>
              </div>
            )}
            {block.caption ? (
              <figcaption className={cn("mt-3 text-center text-sm", mutedClasses[block.style])}>
                {block.caption}
              </figcaption>
            ) : null}
          </figure>
        </section>
      );
    }

    case "button": {
      const href = safeHref(block.href);
      const external = isExternalHref(href);
      return (
        <section className={cn(sectionPadding, styleClasses[block.style], "py-8 md:py-8")}>
          <div className="flex">
            <a
              href={href}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              className={cn(
                "inline-flex h-12 items-center rounded-2xl px-6 text-[15px] font-medium transition-colors",
                block.variant === "primary" &&
                  "bg-cobalt text-white shadow-ws-sm hover:bg-cobalt-strong",
                block.variant === "secondary" &&
                  (block.style === "ink"
                    ? "bg-white text-ink hover:bg-ink-soft"
                    : "bg-ink text-white hover:bg-ink-strong"),
                block.variant === "ghost" &&
                  "border border-line bg-white text-ink hover:bg-ink-soft",
              )}
            >
              {block.label || "Button"}
            </a>
          </div>
        </section>
      );
    }

    case "divider":
      return (
        <section className={cn(sectionPadding, styleClasses[block.style], "py-6 md:py-6")}>
          <hr
            className={cn(
              "h-px w-full max-w-3xl border-0",
              block.style === "ink" ? "bg-white/20" : "bg-ink/15",
            )}
          />
        </section>
      );

    case "quote":
      return (
        <section className={cn(sectionPadding, styleClasses[block.style], "py-10 md:py-12")}>
          <blockquote className="mx-auto max-w-2xl text-center">
            <p className="text-balance break-words text-2xl font-medium leading-snug tracking-tight">
              “{block.text}”
            </p>
            {block.cite ? (
              <cite className={cn("mt-3 block text-sm not-italic", mutedClasses[block.style])}>
                — {block.cite}
              </cite>
            ) : null}
          </blockquote>
        </section>
      );

    case "columns":
      return (
        <section className={cn(sectionPadding, styleClasses[block.style], "pt-6 md:pt-6")}>
          <div
            className={cn(
              "grid gap-5",
              block.cols.length >= 3
                ? "sm:grid-cols-2 lg:grid-cols-3"
                : block.cols.length === 2
                  ? "sm:grid-cols-2"
                  : "",
            )}
          >
            {block.cols.map((col, i) => (
              <div
                key={i}
                className={cn(
                  "flex flex-col gap-2 rounded-2xl border p-6",
                  block.style === "ink"
                    ? "border-white/15 bg-white/5"
                    : "border-line bg-white shadow-ws-sm",
                )}
              >
                <span
                  aria-hidden="true"
                  className="mb-1 grid h-9 w-9 place-items-center rounded-xl bg-cobalt/12 font-mono text-sm font-semibold text-cobalt"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="break-words text-lg font-semibold tracking-tight">
                  {col.heading}
                </h3>
                <p className={cn("whitespace-pre-line break-words text-[15px] leading-relaxed", mutedClasses[block.style])}>
                  {col.text}
                </p>
              </div>
            ))}
          </div>
        </section>
      );

    case "footer":
      return (
        <footer className={cn(sectionPadding, styleClasses[block.style], "py-8 md:py-8")}>
          <p className={cn("text-sm", mutedClasses[block.style])}>{block.text}</p>
        </footer>
      );

    default:
      return <UnknownBlock />;
  }
}
