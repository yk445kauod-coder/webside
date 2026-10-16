"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button, LinkButton } from "@/components/ui/button";

/** Shared body for `error.tsx` boundaries. */
export function ErrorPanel({
  error,
  retry,
  homeHref = "/dashboard",
  homeLabel = "Back to dashboard",
}: {
  error: Error & { digest?: string };
  retry: () => void;
  homeHref?: string;
  homeLabel?: string;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="mx-auto flex max-w-md flex-col items-center px-6 py-24 text-center">
      <p className="ws-eyebrow mb-3">Something went wrong</p>
      <h1 className="ws-h1">We couldn&apos;t load this page</h1>
      <p className="mt-3 text-muted">
        It&apos;s on our side, and your work is safe. Try again, or head back.
      </p>
      {error.digest ? (
        <p className="mt-3 font-mono text-[11px] text-muted">Reference: {error.digest}</p>
      ) : null}
      <div className="mt-7 flex gap-3">
        <Button onClick={retry}>Try again</Button>
        <LinkButton href={homeHref} variant="outline">
          {homeLabel}
        </LinkButton>
      </div>
      <Link href="/" className="sr-only">
        Home
      </Link>
    </div>
  );
}
