import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Defaults are enough for WebSide: pages are dynamic (cookie-based auth) and
// there is no ISR. Add an R2 incremental cache override here if that changes.
export default defineCloudflareConfig();
