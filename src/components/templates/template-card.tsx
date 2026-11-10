"use client";

import { useActionState } from "react";
import { createSiteFromTemplate, type CreateSiteState } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function TemplateUse({ templateKey, label }: { templateKey: string; label: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState<CreateSiteState, FormData>(createSiteFromTemplate, {});
  useEffect(() => {
    if (state.slug) router.push(`/dashboard/sites/${state.slug}`);
  }, [state.slug, router]);
  return (
    <form action={action} className="flex flex-col gap-2 p-4">
      <input type="hidden" name="template" value={templateKey} />
      <label className="sr-only" htmlFor={`n-${templateKey}`}>Site name</label>
      <input
        id={`n-${templateKey}`}
        name="name"
        required
        maxLength={80}
        placeholder="اسم موقعك"
        className="h-11 rounded-xl border border-line bg-white px-3 text-[15px]"
      />
      <Button type="submit" disabled={pending}>{pending ? "جاري الإنشاء…" : `استخدم قالب ${label}`}</Button>
      {state.error ? <p role="alert" className="text-sm text-red-600">{state.error}</p> : null}
    </form>
  );
}
