import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { SettingsForms } from "@/components/site/sudo-settings";

export const metadata: Metadata = { title: "Settings · SUDO" };

export default async function SudoSettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("settings").select("key, value").in("key", ["sudo_admin_emails", "instapay_link"]);
  const get = (k: string) => data?.find((r) => r.key === k)?.value;
  const admins = Array.isArray(get("sudo_admin_emails")) ? (get("sudo_admin_emails") as string[]) : [];
  const instapay = typeof get("instapay_link") === "string" ? (get("instapay_link") as string) : "";

  return (
    <div>
      <div className="mb-8">
        <h1 className="ws-h1">Settings</h1>
        <p className="mt-1 text-muted">Payment link shown to customers and who can access SUDO.</p>
      </div>
      <SettingsForms admins={admins} instapay={instapay} />
    </div>
  );
}
