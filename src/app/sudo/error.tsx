"use client";

import { ErrorPanel } from "@/components/site/error-panel";

export default function SudoError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <ErrorPanel error={error} retry={retry} homeHref="/sudo" homeLabel="Back to review queue" />;
}
