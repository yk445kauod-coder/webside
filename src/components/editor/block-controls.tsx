"use client";

import { Field } from "@/components/ui/field";
import { LIMITS } from "@/lib/limits";
import { cn } from "@/lib/utils";
import type { AnyBlock, BlockStyle, ButtonVariant } from "@/lib/types/blocks";

const styleOptions: { value: BlockStyle; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "tint", label: "Tint" },
  { value: "ink", label: "Ink" },
];

const buttonVariants: { value: ButtonVariant; label: string }[] = [
  { value: "primary", label: "Primary" },
  { value: "secondary", label: "Secondary" },
  { value: "ghost", label: "Ghost" },
];

interface Props {
  block: AnyBlock;
  onChange: (block: AnyBlock) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

/** Inspector form for the selected block. */
export function BlockControls({ block, onChange, onDelete, onDuplicate }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <SegField<BlockStyle>
        label="Background"
        options={styleOptions}
        value={block.style}
        onValue={(style) => onChange({ ...block, style })}
      />

      {block.kind === "hero" ? (
        <>
          <Field
            label="Title"
            value={block.title}
            maxLength={LIMITS.heroTitle}
            onChange={(title) => onChange({ ...block, title })}
          />
          <Field
            textarea
            rows={3}
            label="Subtitle"
            value={block.subtitle}
            maxLength={LIMITS.heroSubtitle}
            onChange={(subtitle) => onChange({ ...block, subtitle })}
          />
          <SegField<"left" | "center">
            label="Alignment"
            options={[
              { value: "left", label: "Left" },
              { value: "center", label: "Center" },
            ]}
            value={block.align}
            onValue={(align) => onChange({ ...block, align })}
          />
        </>
      ) : null}

      {block.kind === "heading" ? (
        <>
          <Field
            label="Heading text"
            value={block.text}
            maxLength={LIMITS.heading}
            onChange={(text) => onChange({ ...block, text })}
          />
          <SegField<"2" | "3">
            label="Size"
            options={[
              { value: "2", label: "Large" },
              { value: "3", label: "Small" },
            ]}
            value={String(block.level) as "2" | "3"}
            onValue={(level) => onChange({ ...block, level: level === "3" ? 3 : 2 })}
          />
        </>
      ) : null}

      {block.kind === "paragraph" ? (
        <Field
          textarea
          rows={6}
          label="Text"
          hint={`${block.text.length}/${LIMITS.paragraph}`}
          value={block.text}
          maxLength={LIMITS.paragraph}
          onChange={(text) => onChange({ ...block, text })}
        />
      ) : null}

      {block.kind === "image" ? (
        <>
          <Field
            label="Image URL"
            placeholder="https://…"
            value={block.src}
            maxLength={LIMITS.url}
            onChange={(src) => onChange({ ...block, src })}
          />
          <Field
            label="Alt text"
            hint="Describes the image for screen readers"
            value={block.alt}
            maxLength={LIMITS.alt}
            onChange={(alt) => onChange({ ...block, alt })}
          />
          <Field
            label="Caption"
            value={block.caption}
            maxLength={LIMITS.caption}
            onChange={(caption) => onChange({ ...block, caption })}
          />
        </>
      ) : null}

      {block.kind === "button" ? (
        <>
          <Field
            label="Label"
            value={block.label}
            maxLength={LIMITS.buttonLabel}
            onChange={(label) => onChange({ ...block, label })}
          />
          <Field
            label="Link"
            hint="https://…, mailto:, tel: or #section"
            placeholder="https://… or #contact"
            value={block.href}
            maxLength={LIMITS.url}
            onChange={(href) => onChange({ ...block, href })}
          />
          <SegField<ButtonVariant>
            label="Style"
            options={buttonVariants}
            value={block.variant}
            onValue={(variant) => onChange({ ...block, variant })}
          />
        </>
      ) : null}

      {block.kind === "quote" ? (
        <>
          <Field
            textarea
            rows={3}
            label="Quote"
            value={block.text}
            maxLength={LIMITS.quote}
            onChange={(text) => onChange({ ...block, text })}
          />
          <Field
            label="Attribution"
            value={block.cite}
            maxLength={LIMITS.cite}
            onChange={(cite) => onChange({ ...block, cite })}
          />
        </>
      ) : null}

      {block.kind === "columns" ? (
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-sm font-medium text-ink">Columns</legend>
          {block.cols.map((col, i) => (
            <div
              key={i}
              className="flex flex-col gap-3 rounded-lg border border-line bg-canvas p-3"
            >
              <Field
                label={`Column ${i + 1} heading`}
                value={col.heading}
                maxLength={LIMITS.columnHeading}
                onChange={(heading) => {
                  const cols = [...block.cols];
                  cols[i] = { ...cols[i], heading };
                  onChange({ ...block, cols });
                }}
              />
              <Field
                textarea
                rows={3}
                label="Text"
                value={col.text}
                maxLength={LIMITS.columnText}
                onChange={(text) => {
                  const cols = [...block.cols];
                  cols[i] = { ...cols[i], text };
                  onChange({ ...block, cols });
                }}
              />
              {block.cols.length > 1 ? (
                <button
                  type="button"
                  onClick={() =>
                    onChange({ ...block, cols: block.cols.filter((_, j) => j !== i) })
                  }
                  className="self-end text-xs font-medium text-danger hover:underline"
                >
                  Remove column {i + 1}
                </button>
              ) : null}
            </div>
          ))}
          {block.cols.length < 3 ? (
            <button
              type="button"
              onClick={() =>
                onChange({ ...block, cols: [...block.cols, { heading: "", text: "" }] })
              }
              className="self-start rounded-lg border border-dashed border-line px-3 py-1.5 text-xs font-medium text-muted hover:border-cobalt/50 hover:text-cobalt"
            >
              + Add column
            </button>
          ) : null}
        </fieldset>
      ) : null}

      {block.kind === "cta" ? (
        <>
          <Field label="Headline" value={block.title} maxLength={LIMITS.ctaTitle} onChange={(title) => onChange({ ...block, title })} />
          <Field textarea rows={3} label="Text" value={block.text} maxLength={LIMITS.ctaText} onChange={(text) => onChange({ ...block, text })} />
          <Field label="Button label" value={block.label} maxLength={LIMITS.buttonLabel} onChange={(label) => onChange({ ...block, label })} />
          <Field label="Link" hint="https://…, mailto:, tel: or #section" value={block.href} maxLength={LIMITS.url} onChange={(href) => onChange({ ...block, href })} />
        </>
      ) : null}

      {block.kind === "faq" ? (
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-sm font-medium text-ink">Questions</legend>
          {block.items.map((it, i) => (
            <div key={i} className="flex flex-col gap-3 rounded-lg border border-line bg-canvas p-3">
              <Field label={`Question ${i + 1}`} value={it.q} maxLength={LIMITS.faqQ} onChange={(q) => { const items = [...block.items]; items[i] = { ...items[i], q }; onChange({ ...block, items }); }} />
              <Field textarea rows={3} label="Answer" value={it.a} maxLength={LIMITS.faqA} onChange={(a) => { const items = [...block.items]; items[i] = { ...items[i], a }; onChange({ ...block, items }); }} />
              <button type="button" onClick={() => onChange({ ...block, items: block.items.filter((_, j) => j !== i) })} className="self-end text-xs font-medium text-danger hover:underline">
                Remove question {i + 1}
              </button>
            </div>
          ))}
          {block.items.length < LIMITS.faqItems ? (
            <button type="button" onClick={() => onChange({ ...block, items: [...block.items, { q: "", a: "" }] })} className="self-start rounded-lg border border-dashed border-line px-3 py-1.5 text-xs font-medium text-muted hover:border-cobalt/50 hover:text-cobalt">
              + Add question
            </button>
          ) : null}
        </fieldset>
      ) : null}

      {block.kind === "stats" ? (
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-sm font-medium text-ink">Numbers</legend>
          {block.items.map((it, i) => (
            <div key={i} className="flex flex-col gap-3 rounded-lg border border-line bg-canvas p-3">
              <Field label="Number" value={it.value} maxLength={LIMITS.statValue} onChange={(value) => { const items = [...block.items]; items[i] = { ...items[i], value }; onChange({ ...block, items }); }} />
              <Field label="Label" value={it.label} maxLength={LIMITS.statLabel} onChange={(label) => { const items = [...block.items]; items[i] = { ...items[i], label }; onChange({ ...block, items }); }} />
              {block.items.length > 1 ? (
                <button type="button" onClick={() => onChange({ ...block, items: block.items.filter((_, j) => j !== i) })} className="self-end text-xs font-medium text-danger hover:underline">
                  Remove
                </button>
              ) : null}
            </div>
          ))}
          {block.items.length < LIMITS.statItems ? (
            <button type="button" onClick={() => onChange({ ...block, items: [...block.items, { value: "", label: "" }] })} className="self-start rounded-lg border border-dashed border-line px-3 py-1.5 text-xs font-medium text-muted hover:border-cobalt/50 hover:text-cobalt">
              + Add number
            </button>
          ) : null}
        </fieldset>
      ) : null}

      {block.kind === "gallery" ? (
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-sm font-medium text-ink">Images</legend>
          {block.images.map((img, i) => (
            <div key={i} className="flex flex-col gap-3 rounded-lg border border-line bg-canvas p-3">
              <Field label={`Image ${i + 1} URL`} placeholder="https://…" value={img.src} maxLength={LIMITS.url} onChange={(src) => { const images = [...block.images]; images[i] = { ...images[i], src }; onChange({ ...block, images }); }} />
              <Field label="Alt text" value={img.alt} maxLength={LIMITS.alt} onChange={(alt) => { const images = [...block.images]; images[i] = { ...images[i], alt }; onChange({ ...block, images }); }} />
              <button type="button" onClick={() => onChange({ ...block, images: block.images.filter((_, j) => j !== i) })} className="self-end text-xs font-medium text-danger hover:underline">
                Remove image {i + 1}
              </button>
            </div>
          ))}
          {block.images.length < LIMITS.galleryItems ? (
            <button type="button" onClick={() => onChange({ ...block, images: [...block.images, { src: "", alt: "" }] })} className="self-start rounded-lg border border-dashed border-line px-3 py-1.5 text-xs font-medium text-muted hover:border-cobalt/50 hover:text-cobalt">
              + Add image
            </button>
          ) : null}
        </fieldset>
      ) : null}

      {block.kind === "footer" ? (
        <Field
          label="Footer text"
          value={block.text}
          maxLength={LIMITS.footer}
          onChange={(text) => onChange({ ...block, text })}
        />
      ) : null}

      <div className="mt-1 flex items-center justify-between border-t border-line pt-3">
        <button
          type="button"
          onClick={onDuplicate}
          className="text-xs font-medium text-muted hover:text-ink hover:underline"
        >
          Duplicate block
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="text-xs font-medium text-danger hover:underline"
        >
          Delete block
        </button>
      </div>
    </div>
  );
}

function SegField<T extends string>({
  label,
  options,
  value,
  onValue,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onValue: (v: T) => void;
}) {
  return (
    <div role="group" aria-label={label}>
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      <div className="flex gap-1 rounded-lg bg-ink-soft p-0.5">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onValue(o.value)}
            className={cn(
              "flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
              value === o.value
                ? "bg-surface text-ink shadow-ws-sm"
                : "text-muted hover:text-ink",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
