"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { TEMPLATES } from "@/lib/templates";
import { createSite } from "@/app/dashboard/actions";
import { cn, slugify } from "@/lib/utils";

export function NewSiteModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [template, setTemplate] = useState(TEMPLATES[0].key);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openModal() {
    setName("");
    setSlug("");
    setSlugTouched(false);
    setError(null);
    setOpen(true);
  }

  async function handleCreate() {
    if (!name.trim() || saving) return;
    setSaving(true);
    setError(null);
    const fd = new FormData();
    fd.set("name", name);
    fd.set("slug", slug.trim() || slugify(name));
    fd.set("template", template);
    const result = await createSite({}, fd);
    if (result.error || !result.slug) {
      setError(result.error ?? "Couldn't create the site. Please try again.");
      setSaving(false);
      return;
    }
    // Keep the dialog (and its busy state) up while navigating, so the
    // button can't be double-clicked into a duplicate site.
    router.push(`/dashboard/sites/${result.slug}`);
  }

  return (
    <>
      <Button onClick={openModal}>
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
        New site
      </Button>

      {open ? (
        <Dialog
          title="Create a site"
          description="Give it a name and pick a starting point. You can change anything later."
          onClose={() => !saving && setOpen(false)}
          className="max-w-lg"
          footer={
            <>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleCreate} loading={saving} disabled={!name.trim()}>
                Create site
              </Button>
            </>
          }
        >
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              void handleCreate();
            }}
          >
            <Field
              label="Site name"
              placeholder="My first site"
              autoFocus
              required
              maxLength={80}
              value={name}
              onChange={(v) => {
                setName(v);
                // Mirror the name into the address until the user edits it.
                if (!slugTouched) setSlug(slugify(v));
              }}
            />
            <Field
              label="Address"
              hint="webside.dev/…"
              placeholder="my-site"
              maxLength={48}
              value={slug}
              onChange={(v) => {
                setSlugTouched(true);
                setSlug(slugify(v));
              }}
            />

            <fieldset>
              <legend className="mb-1.5 text-sm font-medium text-ink">Starting point</legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    aria-pressed={template === t.key}
                    onClick={() => setTemplate(t.key)}
                    className={cn(
                      "flex flex-col rounded-xl border p-3 text-left transition-colors",
                      template === t.key
                        ? "border-cobalt bg-cobalt-soft ring-[3px] ring-cobalt/20"
                        : "border-line bg-white hover:border-ink/30",
                    )}
                  >
                    <span className="text-sm font-semibold text-ink">{t.name}</span>
                    <span className="mt-1 text-xs leading-relaxed text-muted">{t.blurb}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            {error ? (
              <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
                {error}
              </p>
            ) : null}

            {/* Lets Enter submit from the text fields. */}
            <button type="submit" className="hidden" tabIndex={-1} aria-hidden="true" />
          </form>
        </Dialog>
      ) : null}
    </>
  );
}
