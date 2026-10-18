"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { parseBlocks, uuidSchema } from "@/lib/schemas";
import { buildWizardPages, wizardSchema, type WizardInput } from "@/lib/wizard";
import type { PageDraft } from "@/lib/types/blocks";
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

  const slug = fallbackSlug(parsed.data.name, parsed.data.slug ?? "");

  const template = getTemplate(parsed.data.template);
  return persistSite({
    ownerId: user.id,
    name: parsed.data.name,
    slug,
    templateKey: template.key,
    pages: blankPages(template),
  });
}

function fallbackSlug(name: string, wanted: string): string {
  const slug = slugify(wanted || name);
  return slug.length >= 2 ? slug : `site-${slug || Math.random().toString(36).slice(2, 7)}`;
}

async function persistSite(args: {
  ownerId: string;
  name: string;
  slug: string;
  templateKey: string;
  pages: PageDraft[];
}): Promise<CreateSiteState> {
  const supabase = await createClient();
  const { data: site, error: siteError } = await supabase
    .from("sites")
    .insert({
      owner_id: args.ownerId,
      name: args.name,
      slug: args.slug,
      template_key: args.templateKey,
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
    args.pages.map((p) => ({
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

/**
 * Creates a site from the guided wizard. The client only sends the answers;
 * the blocks are generated and validated here, so they can't be tampered with.
 */
export async function createSiteFromWizard(input: WizardInput): Promise<CreateSiteState> {
  const parsed = wizardSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Some answers look invalid." };
  }

  const user = await getSessionUser();
  if (!user) return { error: "You need to sign in." };

  const data = parsed.data;
  const pages = buildWizardPages(data);
  for (const page of pages) {
    const checked = parseBlocks(page.blocks);
    if (!checked.ok) return { error: checked.error };
    page.blocks = checked.blocks;
  }

  return persistSite({
    ownerId: user.id,
    name: data.name,
    slug: fallbackSlug(data.name, data.slug),
    templateKey: `wizard-${data.type}`,
    pages,
  });
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
