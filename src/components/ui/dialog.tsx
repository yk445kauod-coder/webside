"use client";

import { useEffect, useId, useRef } from "react";
import { cn } from "@/lib/utils";

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

interface DialogProps {
  title: string;
  description?: string;
  onClose: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
  /** `bare` renders only the modal frame — the caller owns header/body/footer. */
  bare?: boolean;
  className?: string;
}

/**
 * Accessible modal: Escape closes, Tab is trapped, focus moves in on open and
 * returns to the trigger on close, and the page behind stops scrolling.
 */
export function Dialog({
  title,
  description,
  onClose,
  footer,
  children,
  bare,
  className,
}: DialogProps) {
  const panel = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  const titleId = useId();

  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    const el = panel.current;
    if (!el) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusables = () =>
      Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE));

    (el.querySelector<HTMLElement>("[data-autofocus]") ?? focusables()[0] ?? el).focus();

    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        closeRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-0 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={bare ? undefined : titleId}
        aria-label={bare ? title : undefined}
        tabIndex={-1}
        className={cn(
          "ws-sheet w-full overflow-hidden border border-line bg-surface shadow-ws focus:outline-none",
          "max-h-[100dvh] rounded-t-2xl sm:rounded-2xl",
          bare ? "" : "max-w-md overflow-y-auto p-6",
          className,
        )}
      >
        {bare ? (
          children
        ) : (
          <>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 id={titleId} className="ws-h2">
                  {title}
                </h2>
                {description ? (
                  <p className="mt-1 text-sm text-muted">{description}</p>
                ) : null}
              </div>
              <CloseButton onClick={onClose} />
            </div>
            <div className="flex flex-col gap-4">{children}</div>
            {footer ? (
              <div className="mt-6 flex flex-wrap justify-end gap-2">{footer}</div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

export function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 rounded-lg p-1.5 text-muted hover:bg-ink-soft hover:text-ink"
      aria-label="Close"
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M18 6 6 18M6 6l12 12" />
      </svg>
    </button>
  );
}
