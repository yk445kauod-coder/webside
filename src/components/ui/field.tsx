"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

type CommonProps = {
  label?: string;
  hint?: string;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  required?: boolean;
  maxLength?: number;
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
  type?: never;
  minLength?: never;
};

type UncontrolledProps = CommonProps & {
  value?: never;
  onChange?: never;
  /** When provided, the field is an uncontrolled form input. */
  name: string;
  autoComplete?: string;
  type?: string;
  minLength?: number;
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
    required,
    maxLength,
    className,
    textarea,
    rows,
  } = props;
  const errorId = useId();
  const controlled = "onChange" in props && props.onChange !== undefined;

  const shared = {
    placeholder,
    disabled,
    autoFocus,
    required,
    maxLength,
    "data-autofocus": autoFocus ? "" : undefined,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? errorId : undefined,
    className: cn(
      "w-full rounded-ws border bg-surface px-3 py-2 text-[15px] text-ink",
      "placeholder:text-muted/70 focus:outline-none focus:ring-[3px] focus:ring-copper/25",
      error ? "border-danger" : "border-line",
      disabled && "cursor-not-allowed opacity-60",
    ),
  };
  const controlProps = controlled
    ? {
        value: props.value as string,
        onChange: (
          e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
        ) => props.onChange?.(e.target.value),
      }
    : { name: props.name };

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
          {...shared}
          {...controlProps}
          rows={rows ?? 3}
          className={cn(shared.className, "resize-y leading-relaxed")}
        />
      ) : (
        <input
          {...shared}
          {...controlProps}
          type={(!controlled && props.type) || "text"}
          minLength={controlled ? undefined : props.minLength}
          autoComplete={(!controlled && props.autoComplete) || undefined}
        />
      )}
      {error ? (
        <span id={errorId} role="alert" className="mt-1.5 block text-sm text-danger">
          {error}
        </span>
      ) : null}
    </label>
  );
}
