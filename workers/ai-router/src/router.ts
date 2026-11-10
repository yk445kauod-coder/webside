/** Smart routing between free AI providers. Pure logic, no I/O, so it is unit-testable. */
export interface Health { fails: number; until: number; ewma: number }
export type HealthMap = Record<string, Health>;

const BASE_COOLDOWN = 15_000;
const MAX_COOLDOWN = 10 * 60_000;

/** Starting preference: Pollinations and Gemini answer Arabic best, Workers AI is the always-on safety net. */
export const PRIOR: Record<string, number> = { gemini: 600, openrouter: 1500, pollinations: 2000, workers_ai: 3000, gateway: 9000 };
export const fresh = (id = ""): Health => ({ fails: 0, until: 0, ewma: PRIOR[id] ?? 1500 });

/** Providers that are not cooling down, fastest (EWMA latency, with a little jitter) first. */
export function order(ids: string[], h: HealthMap, now: number, rnd: () => number = Math.random): string[] {
  const ready = ids.filter((id) => (h[id]?.until ?? 0) <= now);
  // If everything is cooling down, still try the one that recovers soonest.
  const pool = ready.length ? ready : [...ids].sort((a, b) => (h[a]?.until ?? 0) - (h[b]?.until ?? 0)).slice(0, 1);
  return pool
    .map((id) => ({ id, score: (h[id]?.ewma ?? PRIOR[id] ?? 1500) * (0.8 + rnd() * 0.4) }))
    .sort((a, b) => a.score - b.score)
    .map((x) => x.id);
}

export function ok(h: HealthMap, id: string, ms: number): void {
  const cur = h[id] ?? fresh(id);
  h[id] = { fails: 0, until: 0, ewma: cur.ewma * 0.7 + ms * 0.3 };
}

/** Back off exponentially. Rate limits (429) cool down for longer than other errors. */
export function fail(h: HealthMap, id: string, now: number, status = 0): void {
  const cur = h[id] ?? fresh(id);
  const fails = cur.fails + 1;
  const base = status === 429 ? BASE_COOLDOWN * 4 : BASE_COOLDOWN;
  h[id] = { ...cur, fails, until: now + Math.min(MAX_COOLDOWN, base * 2 ** (fails - 1)) };
}
