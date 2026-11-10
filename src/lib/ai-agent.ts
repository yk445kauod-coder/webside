/** Client for the WebSide AI router Worker. It holds every provider key; the browser never sees one. */
export interface AgentMessage { role: "user" | "assistant"; content: string }

const URL_ = process.env.NEXT_PUBLIC_AI_ROUTER_URL || "https://webside-ai-router.yk445kauod.workers.dev";

export async function askAgent(messages: AgentMessage[], signal?: AbortSignal): Promise<string> {
  const res = await fetch(URL_, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ messages: messages.slice(-12) }),
    signal,
  });
  if (!res.ok) throw new Error(res.status === 429 ? "rate" : "unavailable");
  const data = (await res.json()) as { reply?: string };
  if (!data.reply) throw new Error("unavailable");
  return data.reply;
}
