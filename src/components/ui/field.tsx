import { cn } from "@/lib/utils";

type CommonProps = {
  label?: string;
  hint?: string;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
  textarea?: boolean;
  rows?: number;
};

type ControlledProps = CommonProps & {
  /** When provided, the field is controlled. */
  value: string;
  onChange: (v: string) => void;
  name?: never;
  autoComplete?: never;
};

type UncontrolledProps = CommonProps & {
  value?: never;
  onChange?: never;
  /** When provided, the field is an uncontrolled form input. */
  name: string;
  autoComplete?: string;
  type?: string;
};

export type FieldProps = ControlledProps | UncontrolledProps;

export function Field(props: FieldProps) {
  const {
    label,
    hint,
    error,
    placeholder,
    disabled,
    autoFocus,
    className,
    textarea,
    rows,
  } = props;
  const base = cn(
    "w-full rounded-[10px] border bg-surface px-3 py-2 text-[15px] text-ink",
    "placeholder:text-muted/70 focus:outline-none focus:ring-[3px] focus:ring-cobalt/25",
    error ? "border-danger" : "border-line",
    disabled && "cursor-not-allowed opacity-60",
  );
  return (
    <label className={cn("block", className)}>
      {label ? (
        <span className="mb-1.5 flex items-baseline justify-between gap-3 text-sm font-medium text-ink">
          {label}
          {hint ? (
            <span className="text-xs font-normal text-muted">{hint}</span>
          ) : null}
        </span>
      ) : null}
      {textarea ? (
        <textarea
          name={"name" in props ? props.name : undefined}
          value={"value" in props ? props.value : undefined}
          onChange={
            "onChange" in props
              ? (e) => props.onChange?.(e.target.value)
              : undefined
          }
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          rows={rows ?? 3}
          className={cn(base, "resize-y leading-relaxed")}
        />
      ) : (
        <input
          name={"name" in props ? props.name : undefined}
          type={"type" in props && props.type ? props.type : "text"}
          value={"value" in props ? props.value : undefined}
          onChange={
            "onChange" in props
              ? (e) => props.onChange?.(e.target.value)
              : undefined
          }
          autoComplete={("autoComplete" in props && props.autoComplete) || undefined}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className={base}
        />
      )}
      {error ? (
        <span className="mt-1.5 block text-sm text-danger">{error}</span>
      ) : null}
    </label>
  );
}