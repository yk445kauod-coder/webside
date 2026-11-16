import { cookies } from "next/headers";
import { getDb, sha256, SESSION_COOKIE, SESSION_DAYS, currentUser } from "./runtime";
import type { DbUser } from "./query";

const ITER = 100_000;
const b64 = (b: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(b instanceof Uint8Array ? b : new Uint8Array(b))));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function derive(password: string, salt: Uint8Array, iter: number) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations: iter }, key, 256));
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2$${ITER}$${b64(salt)}$${b64(await derive(password, salt, ITER))}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [alg, it, salt, hash] = stored.split("$");
  if (alg !== "pbkdf2" || !it || !salt || !hash) return false;
  const got = await derive(password, unb64(salt), Number(it));
  const want = unb64(hash);
  if (got.length !== want.length) return false;
  let diff = 0;
  for (let i = 0; i < got.length; i++) diff |= got[i] ^ want[i];
  return diff === 0;
}

async function startSession(userId: string) {
  const token = b64(crypto.getRandomValues(new Uint8Array(32))).replace(/[+/=]/g, "x");
  const exp = new Date(Date.now() + SESSION_DAYS * 864e5);
  const db = await getDb();
  await db.run("INSERT INTO sessions (id, user_id, expires_at) VALUES (?,?,?)", [await sha256(token), userId, exp.toISOString()]);
  // Opportunistic cleanup keeps the table small without a cron.
  await db.run("DELETE FROM sessions WHERE expires_at < ?", [new Date().toISOString()]);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: exp,
    domain: process.env.NEXT_PUBLIC_COOKIE_HOST || undefined,
  });
}

type AuthErr = { message: string; code?: string };
type AuthRes = { data: { user: DbUser | null; session: { ok: true } | null }; error: AuthErr | null };
const bad = (message: string, code?: string): AuthRes => ({ data: { user: null, session: null }, error: { message, code } });

export const auth = {
  async getUser(): Promise<{ data: { user: DbUser | null } }> {
    return { data: { user: await currentUser() } };
  },

  async signUp(a: { email: string; password: string; options?: { data?: { display_name?: string } } }): Promise<AuthRes> {
    const email = a.email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return bad("Enter a valid email address.");
    if (a.password.length < 8) return bad("Password must be at least 8 characters.");
    const db = await getDb();
    if ((await db.all("SELECT 1 AS x FROM users WHERE email = ?", [email])).length) return bad("That email is already registered. Try signing in.", "user_already_exists");
    const id = crypto.randomUUID();
    await db.run("INSERT INTO users (id, email, password_hash) VALUES (?,?,?)", [id, email, await hashPassword(a.password)]);
    const name = (a.options?.data?.display_name ?? "").trim() || email.split("@")[0];
    await db.run("INSERT INTO profiles (id, email, display_name) VALUES (?,?,?)", [id, email, name]);
    await startSession(id);
    return { data: { user: { id, email }, session: { ok: true } }, error: null };
  },

  async signInWithPassword(a: { email: string; password: string }): Promise<AuthRes> {
    const db = await getDb();
    const rows = await db.all("SELECT id, email, password_hash FROM users WHERE email = ?", [a.email.trim().toLowerCase()]);
    const u = rows[0];
    // Same work either way so timing doesn't reveal whether the email exists.
    const ok = await verifyPassword(a.password, u ? String(u.password_hash) : "pbkdf2$100000$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=");
    if (!u || !ok) return bad("Invalid login credentials", "invalid_credentials");
    await startSession(String(u.id));
    return { data: { user: { id: String(u.id), email: String(u.email) }, session: { ok: true } }, error: null };
  },

  async signOut(): Promise<{ error: null }> {
    const jar = await cookies();
    const token = jar.get(SESSION_COOKIE)?.value;
    if (token) await (await getDb()).run("DELETE FROM sessions WHERE id = ?", [await sha256(token)]);
    jar.set(SESSION_COOKIE, "", { path: "/", maxAge: 0, domain: process.env.NEXT_PUBLIC_COOKIE_HOST || undefined });
    return { error: null };
  },
};
