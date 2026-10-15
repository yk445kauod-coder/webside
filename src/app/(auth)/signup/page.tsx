import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthForm } from "@/components/ui/auth-form";

export const metadata: Metadata = { title: "Create your account" };

// Reads cookies to redirect signed-in users away; block static prerender.
export const instant = false;

export default async function SignUpPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return <AuthForm mode="signup" />;
}