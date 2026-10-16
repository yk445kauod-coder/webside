import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * The signed-in user for this request, or null.
 * Wrapped in `cache` so layouts and pages in the same render share one
 * network round-trip to Supabase Auth instead of each paying for it.
 */
export const getSessionUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/** Whether the current user is on the SUDO allowlist (decided in Postgres). */
export const isSudoUser = cache(async (): Promise<boolean> => {
  const user = await getSessionUser();
  if (!user) return false;
  const supabase = await createClient();
  const { data } = await supabase.rpc("is_sudo");
  return data === true;
});
