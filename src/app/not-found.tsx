import { LinkButton } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="main" className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="ws-eyebrow mb-3">404</p>
      <h1 className="ws-h1">This page isn&apos;t on your side</h1>
      <p className="mt-3 text-muted">
        The link may be old, or the site may belong to someone else.
      </p>
      <div className="mt-7 flex gap-3">
        <LinkButton href="/dashboard">Go to dashboard</LinkButton>
        <LinkButton href="/" variant="outline">
          Home
        </LinkButton>
      </div>
    </main>
  );
}
