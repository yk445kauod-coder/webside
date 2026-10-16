import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/ui/auth-form";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Sign in" };

// Reads cookies to skip the form for signed-in users.
export const instant = false;

export default async function LoginPage() {
  if (await getSessionUser()) redirect("/dashboard");
  return <AuthForm mode="login" />;
}
