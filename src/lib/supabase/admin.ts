import { clientFor } from "@/lib/db/runtime";
import { unsupportedStorage } from "./server";

/** Unscoped data client. SERVER ONLY — used by SUDO server code. */
export async function createAdminClient() {
  const c = await clientFor(null, true);
  return Object.assign(c, { storage: unsupportedStorage });
}
