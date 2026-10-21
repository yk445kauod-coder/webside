"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser, isSudoUser } from "@/lib/auth";

// Every export here is a public endpoint: each action re-checks SUDO, and the settings table's
// RLS policies (settings_all_sudo) enforce it again in Postgres.

type Result = { ok: boolean; error?: string };
const NOT_ALLOWED: Result = { ok: false, error: "Not allowed." };

const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address.").max(254);

export async function saveInstapayLink(value: string): Promise<Result> {
  if (!(await isSudoUser())) return NOT_ALLOWED;
  const parsed = z.string().trim().max(300, "Keep it under 300 characters.").safeParse(value);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  const supabase = await createClient();
  const { error } = await supabase
    .from("settings")
    .upsert({ key: "instapay_link", value: parsed.data, is_public: true, description: "InstaPay payment link/handle shown to customers" });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/sudo/settings");
  return { ok: true };
}

async function readAdmins(supabase: Awaited<ReturnType<typeof createClient>>): Promise<string[]> {
  const { data } = await supabase.from("settings").select("value").eq("key", "sudo_admin_emails").maybeSingle();
  return Array.isArray(data?.value) ? (data.value as unknown[]).filter((e): e is string => typeof e === "string") : [];
}

export async function addSudoAdmin(email: string): Promise<Result> {
  if (!(await isSudoUser())) return NOT_ALLOWED;
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  const supabase = await createClient();
  const admins = await readAdmins(supabase);
  if (admins.map((a) => a.toLowerCase()).includes(parsed.data)) return { ok: false, error: "Already an admin." };
  if (admins.length >= 20) return { ok: false, error: "Too many admins." };
  const { error } = await supabase
    .from("settings")
    .update({ value: [...admins, parsed.data] })
    .eq("key", "sudo_admin_emails");
  if (error) return { ok: false, error: error.message };
  revalidatePath("/sudo/settings");
  return { ok: true };
}

export async function removeSudoAdmin(email: string): Promise<Result> {
  if (!(await isSudoUser())) return NOT_ALLOWED;
  const user = await getSessionUser();
  const target = email.trim().toLowerCase();
  if (user?.email?.toLowerCase() === target) return { ok: false, error: "You can't remove your own access." };
  const supabase = await createClient();
  const admins = await readAdmins(supabase);
  const next = admins.filter((a) => a.toLowerCase() !== target);
  if (next.length === admins.length) return { ok: false, error: "Not in the list." };
  if (next.length === 0) return { ok: false, error: "At least one admin must remain." };
  const { error } = await supabase.from("settings").update({ value: next }).eq("key", "sudo_admin_emails");
  if (error) return { ok: false, error: error.message };
  revalidatePath("/sudo/settings");
  return { ok: true };
}
