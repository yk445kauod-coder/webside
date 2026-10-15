"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getTemplate, blankPages } from "@/lib/templates";
import { slugify } from "@/lib/utils";

const createSiteSchema = z.object({
  name: z.string().trim().min(1, "Give your site a name.").max(80),
  slug: z
    .string()
    .trim()
    .min(2, "Slug must be at least 2 characters.")
    .max(48)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and dashes."),
  template: z.string().min(1),
});

export type CreateSiteState = { error?: string; slug?: string };

export async function createSite(
  _prev: CreateSiteState,
  formData: FormData,
): Promise<CreateSiteState> {
  const parsed = createSiteSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") || (formData.get("name") as string),
    template: formData.get("template"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to sign in." };

  // Normalise slug (respect the allow-all pattern but slugify as fallback)
  const slug = slugify(parsed.data.slug || parsed.data.name);

  const template = getTemplate(parsed.data.template);
  const pages = blankPages(template);

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
      return {
        error: "That slug is already taken — try a different one.",
      };
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
    return { error: pagesError.message };
  }

  revalidatePath("/dashboard");
  return { slug: site.slug };
}

export async function deleteSite(siteId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("sites").delete().eq("id", siteId);
  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return {};
}