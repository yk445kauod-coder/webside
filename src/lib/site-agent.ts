import { PRESETS } from "@/puck/theme";
import { ALLOWED_TYPES } from "@/puck/sanitize";

/** An item as Puck stores it. */
export interface Item { type: string; props: { id: string } & Record<string, unknown> }

export type Op =
  | { op: "set"; index: number; props: Record<string, string | number | boolean> }
  | { op: "add"; type: string; props?: Record<string, string | number | boolean>; index?: number }
  | { op: "remove"; index: number }
  | { op: "move"; from: number; to: number }
  | { op: "theme"; preset: string };

const BLOCKS = ALLOWED_TYPES.filter((t) => !["TemplateSite", "Theme", "Menu", "Contact", "Image"].includes(t));
let n = 0;
const newId = () => `ai-${Date.now().toString(36)}-${(n++).toString(36)}`;

/** One line per block so a small model can see what the page holds. */
export function describePage(items: Item[]): string {
  return items.map((it, i) => {
    const bits = Object.entries(it.props)
      .filter(([k, v]) => k !== "id" && typeof v === "string" && v && !/^(href|src|image)/i.test(k))
      .slice(0, 5).map(([k, v]) => `${k}="${String(v).replace(/\s+/g, " ").slice(0, 50)}"`);
    return `${i}: ${it.type} ${bits.join(" ")}`;
  }).join("\n") || "(empty page)";
}

export function systemPrompt(items: Item[]): string {
  return `You are the WebSide site editor. The owner chats with you to change their website. Reply in the owner's language (simple Egyptian Arabic by default).
Answer with ONLY one JSON object: {"reply":"one short sentence saying what you did","ops":[...]}. No markdown.
ops (max 6): {"op":"set","index":N,"props":{"title":"..."}} | {"op":"add","type":"<Block>","props":{...},"index":N} | {"op":"remove","index":N} | {"op":"move","from":N,"to":M} | {"op":"theme","preset":"<look>"}.
Blocks: ${BLOCKS.join(", ")}. Text props are usually title, description, eyebrow, text, label. Looks (colors+font): ${Object.keys(PRESETS).join(", ")}.
If the request is a question or unclear, return ops [] and answer or ask in reply. Never invent prices, phones or addresses.
Current page:
${describePage(items)}`;
}

export function parseReply(raw: string): { reply: string; ops: Op[] } {
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) return { reply: raw.trim().slice(0, 400), ops: [] };
  try {
    const j = JSON.parse(m[0]) as { reply?: unknown; ops?: unknown };
    const ops = Array.isArray(j.ops) ? (j.ops.slice(0, 6) as Op[]) : [];
    return { reply: typeof j.reply === "string" ? j.reply.slice(0, 400) : "تمام.", ops };
  } catch {
    return { reply: raw.replace(/[{}"]/g, "").trim().slice(0, 400), ops: [] };
  }
}

const cleanProps = (p: unknown): Record<string, string | number | boolean> => {
  const out: Record<string, string | number | boolean> = {};
  if (p && typeof p === "object") for (const [k, v] of Object.entries(p)) {
    if (k === "id" || k === "type") continue;
    if (typeof v === "string") out[k] = v.slice(0, 600);
    else if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
    else if (typeof v === "boolean") out[k] = v;
  }
  return out;
};

/** Apply the agent's ops to a page. Pure; invalid ops are skipped. Returns the new items and how many ops applied. */
export function applyOps(items: Item[], ops: Op[]): { items: Item[]; applied: number } {
  let list = items.map((x) => ({ ...x, props: { ...x.props } }));
  let applied = 0;
  const ok = (i: unknown): i is number => Number.isInteger(i) && (i as number) >= 0 && (i as number) < list.length;
  for (const o of ops) {
    if (!o || typeof o !== "object") continue;
    if (o.op === "set" && ok(o.index)) {
      list[o.index] = { ...list[o.index], props: { ...list[o.index].props, ...cleanProps(o.props) } }; applied++;
    } else if (o.op === "add" && (BLOCKS as readonly string[]).includes(o.type)) {
      const item: Item = { type: o.type, props: { ...cleanProps(o.props), id: newId() } };
      const at = Number.isInteger(o.index) ? Math.min(Math.max(o.index as number, 0), list.length) : list.length;
      list = [...list.slice(0, at), item, ...list.slice(at)]; applied++;
    } else if (o.op === "remove" && ok(o.index)) {
      list = list.filter((_, i) => i !== o.index); applied++;
    } else if (o.op === "move" && ok(o.from) && Number.isInteger(o.to)) {
      const to = Math.min(Math.max(o.to, 0), list.length - 1);
      const [it] = list.splice(o.from, 1); list.splice(to, 0, it); applied++;
    } else if (o.op === "theme" && typeof o.preset === "string" && o.preset in PRESETS) {
      const at = list.findIndex((x) => x.type === "Theme");
      if (at >= 0) list[at] = { ...list[at], props: { ...list[at].props, preset: o.preset } };
      else list = [{ type: "Theme", props: { id: newId(), preset: o.preset } }, ...list];
      applied++;
    }
  }
  return { items: list, applied };
}
