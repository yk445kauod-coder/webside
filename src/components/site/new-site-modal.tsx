"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { TEMPLATES } from "@/lib/templates";
import { createSite } from "@/app/dashboard/actions";
import { cn, slugify } from "@/lib/utils";

export function NewSiteModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [template, setTemplate] = useState(TEMPLATES[0].key);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setSaving(true);
    setError(null);
    const fd = new FormData();
    fd.set("name", name);
    fd.set("slug", slug.trim() || slugify(name));
    fd.set("template", template);
    const result = await createSite({}, fd);
    if (result?.error) {
      setError(result.error);
      setSaving(false);
      return;
    }
    if (result?.slug) {
      setOpen(false);
      setSaving(false);
      router.push(`/dashboard/sites/${result.slug}`);
    }
  }

  return (
    <>
      <Button
        size="md"
        onClick={() => {
          setOpen(true);
          setError(null);
          setName("");
          setSlug("");
        }}
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
        New site
      </Button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Create a new site"
        >
          <div className="w-full max-w-lg rounded-2xl border border-line bg-surface p-6 shadow-ws">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="ws-h2">Create a site</h2>
                <p className="mt-1 text-sm text-muted">
                  Give it a name and pick a starting point. You can change
                  anything later.
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-muted hover:bg-ink-soft hover:text-ink"
                aria-label="Close"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <Field
                label="Site name"
                placeholder="My first site"
                value={name}
                onChange={(v) => {
                  setName(v);
                  if (!slug) setSlug(slugify(v));
                }}
              />
              <Field
                label="Address"
                hint="webside.dev/…"
                placeholder={slugify(name) || "my-site"}
                value={slug}
                onChange={setSlug}
              />

              <div>
                <span className="mb-1.5 block text-sm font-medium text-ink">
                  Starting point
                </span>
                <div className="grid gap-2 sm:grid-cols-3">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setTemplate(t.key)}
                      className={cn(
                        "flex flex-col rounded-xl border p-3 text-left transition-colors",
                        template === t.key
                          ? "border-cobalt bg-cobalt-soft ring-[3px] ring-cobalt/20"
                          : "border-line bg-white hover:border-ink/30",
                      )}
                    >
                      <span className="text-sm font-semibold text-ink">
                        {t.name}
                      </span>
                      <span className="mt-1 text-xs leading-relaxed text-muted">
                        {t.blurb}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {error ? (
                <p
                  role="alert"
                  className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger"
                >
                  {error}
                </p>
              ) : null}

              <div className="mt-1 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} loading={saving} disabled={!name.trim()}>
                  Create site
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}