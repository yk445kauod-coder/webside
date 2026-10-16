"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { uuidSchema } from "@/lib/schemas";
import { getTemplate, blankPages } from "@/lib/templates";
import { slugify } from "@/lib/utils";

const createSiteSchema = z.object({
  name: z.string().trim().min(1, "Give your site a name.").max(80),
  slug: z.string().trim().max(80).optional(),
  template: z.string().min(1),
});

export type CreateSiteState = { error?: string; slug?: string };

export async function createSite(
  _prev: CreateSiteState,
  formData: FormData,
): Promise<CreateSiteState> {
  const parsed = createSiteSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") || undefined,
    template: formData.get("template"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const user = await getSessionUser();
  if (!user) return { error: "You need to sign in." };

  // Normalise the address. Names with no latin letters (e.g. Arabic) slugify
  // to nothing, so fall back to a short random suffix instead of failing.
  let slug = slugify(parsed.data.slug || parsed.data.name);
  if (slug.length < 2) {
    slug = `site-${slug || Math.random().toString(36).slice(2, 7)}`;
  }

  const template = getTemplate(parsed.data.template);
  const pages = blankPages(template);

  const supabase = await createClient();
  const { data: site, error: siteError } = await supabase
    .from("sites")
    .insert({
      owner_id: user.id,
      name: parsed.data.name,
      slug,
      template_key: template.key,
      description: null,
    })
    .select()
    .single();

  if (siteError) {
    if (siteError.code === "23505") {
      return { error: "That address is already taken — try a different one." };
    }
    return { error: siteError.message };
  }

  const { error: pagesError } = await supabase.from("pages").insert(
    pages.map((p) => ({
      site_id: site.id,
      key: p.key,
      title: p.title,
      path: p.path,
      blocks: p.blocks,
    })),
  );

  if (pagesError) {
    // Don't leave a half-built, page-less site behind.
    await supabase.from("sites").delete().eq("id", site.id);
    return { error: "Couldn't set up the starting pages. Please try again." };
  }

  revalidatePath("/dashboard");
  return { slug: site.slug };
}

export async function deleteSite(siteId: string): Promise<{ error?: string }> {
  if (!uuidSchema.safeParse(siteId).success) return { error: "Unknown site." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sites")
    .delete()
    .eq("id", siteId)
    .select("id");
  if (error) return { error: error.message };
  if (!data?.length) return { error: "Site not found, or you don't own it." };
  revalidatePath("/dashboard");
  return {};
}
