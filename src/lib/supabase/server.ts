// Historical path: this is now the D1-backed data client (see src/lib/db). Same call shape as before.
import { currentUser, clientFor } from "@/lib/db/runtime";
import { auth } from "@/lib/db/auth";

/** Data client scoped to the signed-in user (row access rules enforced in code). */
export async function createClient() {
  const user = await currentUser();
  const c = await clientFor(user);
  return Object.assign(c, { auth, storage: unsupportedStorage });
}

export const unsupportedStorage = {
  from(_bucket: string) {
    void _bucket;
    const err = { message: "File uploads are not enabled." };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fail = async (..._a: unknown[]): Promise<{ data: any; error: { message: string } }> => ({ data: null, error: err });
    return { createSignedUrl: fail, remove: fail, upload: fail };
  },
};
