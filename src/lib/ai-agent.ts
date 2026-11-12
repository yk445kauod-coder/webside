/** Client for the WebSide AI router Worker. It holds every provider key; the browser never sees one. */
export interface AgentMessage { role: "user" | "assistant"; content: string }

const URL_ = process.env.NEXT_PUBLIC_AI_ROUTER_URL || "https://webside-ai-router.yk445kauod.workers.dev";
/** Public no-key gateway used only if the router itself cannot be reached. */
const GATEWAY = "https://ai-gateway.vivorax.online/api/ai/generate";

type Mode = "chat" | "editor";

async function viaRouter(messages: AgentMessage[], mode: Mode, signal?: AbortSignal): Promise<string> {
  const res = await fetch(URL_, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ messages: messages.slice(-12), mode }),
    signal: signal ?? AbortSignal.timeout(40_000),
  });
  if (res.status === 429) throw new Error("rate");
  if (!res.ok) throw new Error("unavailable");
  const data = (await res.json()) as { reply?: string };
  if (!data.reply) throw new Error("unavailable");
  return data.reply;
}

/** Last resort when the router is down: ask the free gateway directly. */
async function viaGateway(messages: AgentMessage[]): Promise<string> {
  const prompt = `${messages.slice(-8).map((m) => `${m.role}: ${m.content}`).join("\n")}\nassistant:`;
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ prompt, config: { stream: false, temperature: 0.4, max_tokens: 1200 } }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error("unavailable");
  const text = ((await res.json()) as { result?: string }).result?.trim();
  if (!text) throw new Error("unavailable");
  return text;
}

/** Ask the agent. Tries the router twice, then the gateway, so a single outage never stops the owner. */
export async function askAgent(messages: AgentMessage[], signal?: AbortSignal, mode: Mode = "chat"): Promise<string> {
  let last: Error = new Error("unavailable");
  for (let attempt = 0; attempt < 2; attempt++) {
    try { return await viaRouter(messages, mode, signal); }
    catch (e) {
      last = e as Error;
      if (signal?.aborted) throw last;
      if (last.message === "rate") break; // slow down instead of hammering
      await new Promise((r) => setTimeout(r, 600));
    }
  }
  if (last.message === "rate") throw last;
  try { return await viaGateway(messages); } catch { throw new Error("unavailable"); }
}
