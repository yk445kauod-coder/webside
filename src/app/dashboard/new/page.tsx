import type { Metadata } from "next";
import { SiteWizard } from "@/components/wizard/site-wizard";

export const metadata: Metadata = { title: "Create a site" };

export default function NewSitePage() {
  return <SiteWizard />;
}
