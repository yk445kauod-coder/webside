import type { AnyBlock, BlockStyle } from "@/lib/types/blocks";
import { cn } from "@/lib/utils";

const styleClasses: Record<BlockStyle, string> = {
  light: "bg-white text-ink",
  tint: "bg-cobalt-soft text-ink",
  ink: "bg-ink text-white",
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
  switch (block.kind) {
    case "hero": {
      const align =
        block.align === "center"
          ? "text-center items-center"
          : "text-left items-start";
      return (
        <section
          className={cn(
            sectionPadding,
            styleClasses[block.style],
            "flex flex-col gap-5",
            align,
          )}
        >
          <div className="max-w-3xl text-balance">
            <h1 className="ws-display">{block.title}</h1>
          </div>
          <p
            className={cn(
              "max-w-xl text-lg leading-relaxed opacity-85",
              block.align === "center" && "mx-auto",
            )}
          >
            {block.subtitle}
          </p>
        </section>
      );
    }

    case "heading":
      return (
        <section className={cn(sectionPadding, styleClasses[block.style], "pb-0 pt-10")}>
          {block.level === 2 ? (
            <h2 className="ws-h1">{block.text}</h2>
          ) : (
            <h3 className="ws-h2">{block.text}</h3>
          )}
        </section>
      );

    case "paragraph":
      return (
        <section className={cn(sectionPadding, styleClasses[block.style], "py-8")}>
          <p className="max-w-2xl text-[17px] leading-relaxed text-ink/85">
            {block.text}
          </p>
        </section>
      );

    case "image":
      return (
        <section className={cn(sectionPadding, styleClasses[block.style], "py-10")}>
          <figure className="mx-auto max-w-3xl">
            {block.src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={block.src}
                alt={block.alt || "Site image"}
                className="aspect-[16/9] w-full rounded-xl object-cover"
              />
            ) : (
              <div className="flex aspect-[16/9] w-full items-center justify-center rounded-xl border border-dashed border-line bg-canvas">
                <span className="text-sm text-muted">No image yet</span>
              </div>
            )}
            {block.caption ? (
              <figcaption className="mt-3 text-center text-sm text-muted">
                {block.caption}
              </figcaption>
            ) : null}
          </figure>
        </section>
      );

    case "button":
      return (
        <section className={cn(sectionPadding, styleClasses[block.style], "py-10")}>
          <div className="flex">
            <a
              href={block.href}
              target={block.href.startsWith("http") ? "_blank" : undefined}
              rel={block.href.startsWith("http") ? "noreferrer" : undefined}
              className={cn(
                "inline-flex items-center rounded-[10px] px-5 h-11 text-[15px] font-medium transition-colors",
                block.variant === "primary" &&
                  "bg-cobalt text-white hover:bg-[#3357c9]",
                block.variant === "secondary" &&
                  "bg-ink text-white hover:bg-[#101820]",
                block.variant === "ghost" &&
                  "border border-line bg-white text-ink hover:bg-ink-soft",
              )}
            >
              {block.label || "Button"}
            </a>
          </div>
        </section>
      );

    case "divider":
      return (
        <section className={cn(sectionPadding, styleClasses[block.style], "py-6")}>
          <div className="h-px w-full max-w-3xl bg-ink/15" />
        </section>
      );

    case "quote":
      return (
        <section className={cn(sectionPadding, styleClasses[block.style])}>
          <blockquote className="mx-auto max-w-2xl text-center">
            <p className="text-2xl font-medium leading-snug tracking-tight text-balance">
              “{block.text}”
            </p>
            {block.cite ? (
              <cite className="mt-3 block text-sm not-italic text-muted">
                — {block.cite}
              </cite>
            ) : null}
          </blockquote>
        </section>
      );

    case "columns":
      return (
        <section className={cn(sectionPadding, styleClasses[block.style], "pt-8")}>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {block.cols.map((col, i) => (
              <div key={i} className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold tracking-tight">{col.heading}</h3>
                <p className="text-[15px] leading-relaxed text-ink/70">{col.text}</p>
              </div>
            ))}
          </div>
        </section>
      );

    case "footer":
      return (
        <footer className={cn(sectionPadding, styleClasses[block.style], "py-8")}>
          <p className="text-sm text-ink/60">{block.text}</p>
        </footer>
      );

    default:
      return <UnknownBlock />;
  }
}