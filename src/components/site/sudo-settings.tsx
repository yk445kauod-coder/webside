"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { addSudoAdmin, removeSudoAdmin, saveInstapayLink } from "@/app/sudo/settings/actions";

type Result = { ok: boolean; error?: string };

export function SettingsForms({ admins, instapay }: { admins: string[]; instapay: string }) {
  const router = useRouter();
  const [link, setLink] = useState(instapay);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function run(key: string, fn: () => Promise<Result>, done: string) {
    setBusy(key);
    setMsg(null);
    const res = await fn();
    setBusy(null);
    setMsg({ ok: res.ok, text: res.ok ? done : (res.error ?? "Something went wrong.") });
    if (res.ok) router.refresh();
    return res.ok;
  }

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <section className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5">
        <h2 className="ws-h2">InstaPay</h2>
        <Field
          label="Payment link or handle"
          hint="Shown to customers when they publish"
          placeholder="https://ipn.eg/S/yourname/instapay"
          value={link}
          maxLength={300}
          onChange={setLink}
        />
        <div>
          <Button loading={busy === "link"} disabled={busy !== null} onClick={() => run("link", () => saveInstapayLink(link), "Saved.")}>
            Save
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5">
        <h2 className="ws-h2">SUDO admins</h2>
        <ul className="divide-y divide-line">
          {admins.map((a) => (
            <li key={a} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span className="truncate font-mono">{a}</span>
              <Button
                variant="outline"
                disabled={busy !== null}
                onClick={() => {
                  if (confirm(`Remove ${a}?`)) void run(`rm-${a}`, () => removeSudoAdmin(a), "Removed.");
                }}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
        <Field label="Add admin email" placeholder="name@example.com" value={email} maxLength={254} onChange={setEmail} />
        <div>
          <Button
            variant="secondary"
            loading={busy === "add"}
            disabled={!email.trim() || busy !== null}
            onClick={async () => {
              if (await run("add", () => addSudoAdmin(email), "Added.")) setEmail("");
            }}
          >
            Add admin
          </Button>
        </div>
        <p className="text-xs text-muted">Access applies once that person signs in with a confirmed email.</p>
      </section>

      {msg ? (
        <p role="status" className={msg.ok ? "text-sm text-success" : "rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger"}>
          {msg.text}
        </p>
      ) : null}
    </div>
  );
}
