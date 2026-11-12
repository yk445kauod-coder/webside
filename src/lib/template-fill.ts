import { askAgent } from "@/lib/ai-agent";
import { listSlots } from "@/lib/template-site";

export interface FillInput {
  templateKey: string;
  name: string;
  about?: string;
  phone?: string;
  address?: string;
  lang: "ar" | "en";
}

/**
 * Asks the AI to rewrite the template's text snippets for a real business. Design, colours, fonts, images and motion
 * stay the template's own. Returns the replacement text per slot index; a failed batch just keeps the template text.
 */
export async function fillTemplate(i: FillInput, onProgress?: (done: number, total: number) => void): Promise<Record<string, string>> {
  const slots = listSlots(i.templateKey)
    .texts.map((t, k) => ({ i: k, t: t.replace(/\s+/g, " ") }))
    .filter((s) => s.t.length >= 2 && s.t.length <= 220)
    .slice(0, 150);
  const batches: (typeof slots)[] = [];
  for (let k = 0; k < slots.length; k += 30) batches.push(slots.slice(k, k + 30));
  const language = i.lang === "ar" ? "Arabic" : "English";
  const out: Record<string, string> = {};
  for (let b = 0; b < batches.length; b++) {
    const prompt =
      `You are rewriting the text of a ready-made website template so it fits a real business.\n` +
      `Business name: ${i.name}\nWhat they do and sell: ${i.about || "(not given)"}\n` +
      `Phone: ${i.phone || "(not given)"}\nAddress: ${i.address || "(not given)"}\n` +
      `Write every new text in ${language}.\n` +
      `Below are text snippets from the page, one per line as "id|text". Reply with ONLY a JSON object that maps id to the replacement text. ` +
      `Replace anything about the template's example business: its name, slogans, descriptions, products, services, menu items, prices, people, testimonials, address, phone, email and opening hours. ` +
      `Use the real business name wherever a brand name appears. Never invent a phone number or address: use the ones given, or leave that id out. ` +
      `${i.lang === "ar" ? "Translate navigation labels and buttons too. " : "Leave short navigation labels and buttons out unless they are wrong for this business. "}` +
      `Keep each replacement about as long as the original.\n\n` +
      batches[b].map((s) => `${s.i}|${s.t}`).join("\n");
    try {
      const raw = await askAgent([{ role: "user", content: prompt }]);
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) {
        const j = JSON.parse(m[0]) as Record<string, unknown>;
        for (const s of batches[b]) {
          const v = j[String(s.i)];
          if (typeof v === "string" && v.trim()) out[String(s.i)] = v.trim().slice(0, 400);
        }
      }
    } catch {
      /* a failed batch keeps the template's own text for those snippets */
    }
    onProgress?.(b + 1, batches.length);
  }
  return out;
}
