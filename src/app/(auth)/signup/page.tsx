import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/ui/auth-form";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Create account" };

// Reads cookies to skip the form for signed-in users.

export default async function SignupPage() {
  if (await getSessionUser()) redirect("/dashboard");
  return <AuthForm mode="signup" />;
}
