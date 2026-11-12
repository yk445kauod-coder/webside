import { fail, ok, order, type HealthMap } from "./router";

interface Env {
  AI: { run(model: string, input: unknown): Promise<{ response?: string }> };
  ALLOWED_ORIGINS: string;
  OPENROUTER_API_KEY?: string;
  GEMINI_API_KEY?: string;
  POLLINATIONS_API_KEY?: string;
}
type Msg = { role: "user" | "assistant"; content: string };

const SYSTEM = `You are the WebSide onboarding agent. WebSide ("Your Web, Your Side") builds small-business websites: menus, catalogs, business sites and stores.
Reply in the user's language; default to simple Egyptian Arabic. Be brief and warm.
Your job: learn what the business does, its name, city, products or services, phone/WhatsApp, and the look they want, asking ONE short question at a time.
When you have enough, tell them you are ready to build and summarise the site in 3 lines. Never invent prices or contact details.`;

/** Editor mode: the owner is chatting with their site, and the reply must be one JSON object. */
const SYSTEM_EDITOR = `You are a precise JSON-only API that edits small-business websites. Follow the instructions in the user message exactly and answer with ONLY the requested JSON object, no markdown fences, no extra text.`;
const MODES: Record<string, Opts> = {
  chat: { system: SYSTEM, max: 500, temp: 0.6 },
  editor: { system: SYSTEM_EDITOR, max: 1400, temp: 0.2 },
};

const TIMEOUT = 8_000;
const MAX_BODY = 32_000;

const health: HealthMap = {};
const hits = new Map<string, number[]>();

interface Opts { system: string; max: number; temp: number }
type Provider = (env: Env, msgs: Msg[], signal: AbortSignal, o: Opts) => Promise<string>;
const chatBody = (model: string, msgs: Msg[], o: Opts) => JSON.stringify({ model, messages: [{ role: "system", content: o.system }, ...msgs], temperature: o.temp, max_tokens: o.max });
const fromOpenAI = async (r: Response) => {
  if (!r.ok) throw Object.assign(new Error(`HTTP ${r.status}`), { status: r.status });
  const j = (await r.json()) as { choices?: { message?: { content?: string } }[] };
  const t = j.choices?.[0]?.message?.content?.trim();
  if (!t) throw new Error("empty");
  return t;
};

const PROVIDERS: Record<string, Provider> = {
  workers_ai: async (env, msgs, _s, o) => {
    const out = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", { messages: [{ role: "system", content: o.system }, ...msgs], max_tokens: o.max, temperature: o.temp });
    if (!out.response) throw new Error("empty");
    return out.response.trim();
  },
  gemini: async (env, msgs, signal, o) => {
    if (!env.GEMINI_API_KEY) throw new Error("no key");
    const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent", {
      method: "POST", signal,
      headers: { "content-type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: o.system }] },
        contents: msgs.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
        generationConfig: { temperature: o.temp, maxOutputTokens: o.max },
      }),
    });
    if (!r.ok) throw Object.assign(new Error(`HTTP ${r.status}`), { status: r.status });
    const j = (await r.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const t = j.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim();
    if (!t) throw new Error("empty");
    return t;
  },
  openrouter: async (env, msgs, signal, o) => {
    if (!env.OPENROUTER_API_KEY) throw new Error("no key");
    return fromOpenAI(await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST", signal,
      headers: { "content-type": "application/json", authorization: `Bearer ${env.OPENROUTER_API_KEY}`, "x-title": "WebSide" },
      body: chatBody("google/gemma-4-31b-it:free", msgs, o),
    }));
  },
  pollinations: async (env, msgs, signal, o) =>
    fromOpenAI(await fetch("https://text.pollinations.ai/openai", {
      method: "POST", signal,
      headers: { "content-type": "application/json", ...(env.POLLINATIONS_API_KEY ? { authorization: `Bearer ${env.POLLINATIONS_API_KEY}` } : {}) },
      body: chatBody("openai", msgs, o),
    })),
  gateway: async (_env, msgs, signal, o) => {
    const prompt = `${o.system}\n\n${msgs.map((m) => `${m.role}: ${m.content}`).join("\n")}\nassistant:`;
    const r = await fetch("https://ai-gateway.vivorax.online/api/ai/generate", {
      method: "POST", signal, headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt, config: { stream: false, temperature: o.temp, max_tokens: o.max } }),
    });
    if (!r.ok) throw Object.assign(new Error(`HTTP ${r.status}`), { status: r.status });
    const t = ((await r.json()) as { result?: string }).result?.trim();
    if (!t) throw new Error("empty");
    return t;
  },
};

function cors(env: Env, origin: string | null): Record<string, string> {
  const allowed = env.ALLOWED_ORIGINS.split(",").map((s) => s.trim());
  const h: Record<string, string> = { vary: "origin", "access-control-allow-methods": "POST, OPTIONS", "access-control-allow-headers": "content-type" };
  if (origin && allowed.includes(origin)) h["access-control-allow-origin"] = origin;
  return h;
}
const json = (b: unknown, status: number, h: Record<string, string>) =>
  new Response(JSON.stringify(b), { status, headers: { "content-type": "application/json; charset=utf-8", ...h } });

function limited(ip: string, now: number): boolean {
  const w = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  w.push(now); hits.set(ip, w);
  if (hits.size > 5000) hits.clear();
  return w.length > 20;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const origin = req.headers.get("origin");
    const h = cors(env, origin);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: h });
    if (req.method !== "POST") return json({ error: "method" }, 405, h);
    // Browsers from other sites are refused; the keys live only in this Worker.
    if (origin && !h["access-control-allow-origin"]) return json({ error: "origin" }, 403, h);
    const now = Date.now();
    if (limited(req.headers.get("cf-connecting-ip") ?? "x", now)) return json({ error: "slow down" }, 429, h);

    const text = await req.text();
    if (text.length > MAX_BODY) return json({ error: "too large" }, 413, h);
    let msgs: Msg[];
    let opts = MODES.chat;
    try {
      const b = JSON.parse(text) as { messages?: unknown; mode?: unknown };
      if (b.mode === "editor") opts = MODES.editor;
      msgs = (Array.isArray(b.messages) ? b.messages : []).slice(-20)
        .filter((m): m is Msg => !!m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
        .map((m) => ({ role: m.role, content: m.content.slice(0, opts === MODES.editor ? 8000 : 2000) }));
    } catch { return json({ error: "bad json" }, 400, h); }
    if (!msgs.length || msgs[msgs.length - 1].role !== "user") return json({ error: "no message" }, 400, h);

    const trace: string[] = [];
    // Never die: if every provider failed, wait a moment and give each one more try, cooldowns or not.
    for (let pass = 0; pass < 2; pass++) {
      const ids = pass === 0 ? order(Object.keys(PROVIDERS), health, Date.now()) : Object.keys(PROVIDERS);
      if (pass === 1) await new Promise((r) => setTimeout(r, 800));
      for (const id of ids) {
        const ctl = new AbortController();
        const timer = setTimeout(() => ctl.abort(), TIMEOUT);
        const t0 = Date.now();
        try {
          const reply = await PROVIDERS[id](env, msgs, ctl.signal, opts);
          ok(health, id, Date.now() - t0);
          return json({ reply, provider: id, trace }, 200, h);
        } catch (e) {
          trace.push(`${id}:${(e as Error).message}`);
          fail(health, id, Date.now(), (e as { status?: number }).status);
        } finally { clearTimeout(timer); }
      }
    }
    return json({ error: "all providers busy, try again shortly" }, 503, h);
  },
};
