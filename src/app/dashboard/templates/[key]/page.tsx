import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TemplateStart } from "@/components/templates/template-start";
import { isTemplateKey } from "@/lib/template-site";

export const metadata: Metadata = { title: "ابدأ من قالب" };

export default async function StartTemplatePage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!isTemplateKey(key)) notFound();
  return <TemplateStart templateKey={key} />;
}
