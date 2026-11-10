import { SiteDocument } from "@/components/preview/site-document";
import type { TemplateInfo } from "@/puck/templates";
import { ScaledFrame } from "./scaled-frame";

/**
 * A live miniature of a template: the real page rendered at desktop width and scaled down.
 * Photos load in the visitor's browser, and the preview can never drift from the template.
 */
export function TemplateThumb({ template }: { template: TemplateInfo }) {
  return (
    <ScaledFrame>
      <div dir="rtl" lang="ar">
        <SiteDocument blocks={template.pages[0].items.slice(0, 3) as never} siteName={template.nameAr} nav={[]} />
      </div>
    </ScaledFrame>
  );
}
