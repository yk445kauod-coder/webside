import type { Metadata } from "next";
import { AiOnboarding } from "@/components/wizard/ai-onboarding";

export const metadata: Metadata = { title: "Create a site" };

export default function NewSitePage() {
  return <AiOnboarding />;
}
