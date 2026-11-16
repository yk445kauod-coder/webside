"use client";

/** Browser-side helper: sign-out and the current user go through our own API routes. */
export function createClient() {
  return {
    auth: {
      async getUser() {
        const r = await fetch("/api/auth/me", { cache: "no-store" });
        const j = (await r.json().catch(() => ({}))) as { user?: { id: string; email: string } | null };
        return { data: { user: j.user ?? null } };
      },
      async signOut() {
        await fetch("/api/auth/signout", { method: "POST" });
        return { error: null };
      },
    },
    storage: {
      from(_bucket: string) {
        void _bucket;
        return { upload: async (..._a: unknown[]) => ({ data: null, error: { message: "File uploads are not enabled." } }) };
      },
    },
  };
}
