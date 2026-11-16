import { cache } from "react";
import { currentUser, userIsSudo } from "@/lib/db/runtime";

/** The signed-in user for this request, or null (one lookup shared by the whole render). */
export const getSessionUser = cache(async () => currentUser());

/** Whether the current user is on the SUDO allowlist (settings table or SUDO_ADMIN_EMAILS). */
export const isSudoUser = cache(async (): Promise<boolean> => userIsSudo(await currentUser()));
