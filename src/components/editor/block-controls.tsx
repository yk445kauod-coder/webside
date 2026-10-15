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
}

function TextInput({
  label,
  value,
  onValue,
  placeholder,
}: {
  label: string;
  value: string;
  onValue: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink">{label}</span>
      <input
        value={value}
        onChange={(e) => onValue(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-line bg-white px-2.5 py-1.5 text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-cobalt/25"
      />
    </label>
  );
}

export function BlockControls({ block, onChange, onDelete }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <ControlRow>
        <StylePicker
          value={block.style}
          onChange={(style) => onChange({ ...block, style })}
        />
      </ControlRow>

      {block.kind === "hero" ? (
        <>
          <TextInput
            label="Title"
            value={block.title}
            onValue={(v) => onChange({ ...block, title: v })}
          />
          <TextInput
            label="Subtitle"
            value={block.subtitle}
            onValue={(v) => onChange({ ...block, subtitle: v })}
          />
          <SegField<string>
            label="Alignment"
            options={[
              { value: "left", label: "Left" },
              { value: "center", label: "Center" },
            ]}
            value={block.align}
            onValue={(align) =>
              onChange({ ...block, align: align as "left" | "center" })
            }
          />
        </>
      ) : null}

      {block.kind === "heading" ? (
        <>
          <TextInput
            label="Heading text"
            value={block.text}
            onValue={(v) => onChange({ ...block, text: v })}
          />
          <SegField<string>
            label="Level"
            options={[
              { value: "2", label: "H2" },
              { value: "3", label: "H3" },
            ]}
            value={String(block.level)}
            onValue={(level) =>
              onChange({ ...block, level: level === "3" ? 3 : 2 })
            }
          />
        </>
      ) : null}

      {block.kind === "paragraph" ? (
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink">Text</span>
          <textarea
            value={block.text}
            onChange={(e) => onChange({ ...block, text: e.target.value })}
            rows={5}
            className="w-full resize-y rounded-lg border border-line bg-white px-2.5 py-1.5 text-sm leading-relaxed text-ink focus:outline-none focus:ring-2 focus:ring-cobalt/25"
          />
        </label>
      ) : null}

      {block.kind === "image" ? (
        <>
          <TextInput label="Image URL" value={block.src} onValue={(v) => onChange({ ...block, src: v })} placeholder="https://…" />
          <TextInput label="Alt text" value={block.alt} onValue={(v) => onChange({ ...block, alt: v })} />
          <TextInput label="Caption" value={block.caption} onValue={(v) => onChange({ ...block, caption: v })} />
        </>
      ) : null}

      {block.kind === "button" ? (
        <>
          <TextInput label="Label" value={block.label} onValue={(v) => onChange({ ...block, label: v })} />
          <TextInput label="Link (URL or anchor)" value={block.href} onValue={(v) => onChange({ ...block, href: v })} placeholder="https://… or #contact" />
          <SegField<ButtonVariant>
            label="Variant"
            options={buttonVariants}
            value={block.variant}
            onValue={(variant) => onChange({ ...block, variant })}
          />
        </>
      ) : null}

      {block.kind === "quote" ? (
        <>
          <TextInput label="Quote" value={block.text} onValue={(v) => onChange({ ...block, text: v })} />
          <TextInput label="Attribution" value={block.cite} onValue={(v) => onChange({ ...block, cite: v })} />
        </>
      ) : null}

      {block.kind === "columns" ? (
        <div className="flex flex-col gap-3">
          <span className="text-xs font-medium text-ink">Columns</span>
          {block.cols.map((col, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-lg border border-line bg-white p-2.5">
              <TextInput
                label={`Column ${i + 1} heading`}
                value={col.heading}
                onValue={(v) => {
                  const cols = [...block.cols];
                  cols[i] = { ...cols[i], heading: v };
                  onChange({ ...block, cols });
                }}
              />
              <TextInput
                label="Text"
                value={col.text}
                onValue={(v) => {
                  const cols = [...block.cols];
                  cols[i] = { ...cols[i], text: v };
                  onChange({ ...block, cols });
                }}
              />
              <button
                onClick={() => {
                  const cols = block.cols.filter((_, j) => j !== i);
                  onChange({ ...block, cols: cols.length ? cols : [{ heading: "", text: "" }] });
                }}
                className="self-end text-xs font-medium text-danger hover:underline"
              >
                Remove column
              </button>
            </div>
          ))}
          {block.cols.length < 3 ? (
            <button
              onClick={() =>
                onChange({
                  ...block,
                  cols: [...block.cols, { heading: "", text: "" }],
                })
              }
              className="self-start rounded-lg border border-dashed border-line px-3 py-1.5 text-xs font-medium text-muted hover:border-ink/40 hover:text-ink"
            >
              + Add column
            </button>
          ) : null}
        </div>
      ) : null}

      {block.kind === "footer" ? (
        <TextInput label="Footer text" value={block.text} onValue={(v) => onChange({ ...block, text: v })} />
      ) : null}

      <div className="mt-1 border-t border-line pt-3">
        <button
          onClick={onDelete}
          className="text-xs font-medium text-danger hover:underline"
        >
          Delete block
        </button>
      </div>
    </div>
  );
}

function ControlRow({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

function StylePicker({
  value,
  onChange,
}: {
  value: BlockStyle;
  onChange: (s: BlockStyle) => void;
}) {
  return (
    <SegField<BlockStyle>
      label="Background"
      options={styleOptions}
      value={value}
      onValue={onChange}
    />
  );
}

function SegField<T extends string>({
  label,
  options,
  value,
  onValue,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: T;
  onValue: (v: T) => void;
}) {
  return (
    <div>
      <span className="mb-1 block text-xs font-medium text-ink">{label}</span>
      <div className="flex gap-1 rounded-lg bg-ink-soft p-0.5">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onValue(o.value as T)}
            className={`flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
              value === o.value
                ? "bg-surface text-ink shadow-sm"
                : "text-muted hover:text-ink"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}