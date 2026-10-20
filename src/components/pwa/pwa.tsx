"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "ws-install-dismissed";

function readDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

/** Registers the service worker (production only). Renders nothing. */
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}

/** A small, dismissible "install the app" card. Android/desktop use the native prompt; iOS gets instructions. */
export function InstallPrompt() {
  const [evt, setEvt] = useState<InstallEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone || readDismissed()) return;
    // Deferred so the first client render matches the server HTML.
    const t = setTimeout(() => {
      const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
      setIos(isIos);
      if (isIos) setHidden(false);
    }, 0);
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvt(e as InstallEvent);
      setHidden(false);
    };
    const onInstalled = () => setHidden(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      clearTimeout(t);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (hidden || (!evt && !ios)) return null;

  const dismiss = () => {
    setHidden(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
  };

  return (
    <div className="mb-6 flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 pr-2 shadow-ws-sm">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white" style={{ background: "var(--ws-grad)" }}>
        {ios ? <Share className="h-5 w-5" aria-hidden="true" /> : <Download className="h-5 w-5" aria-hidden="true" />}
      </span>
      <p className="min-w-0 flex-1 text-sm">
        <span className="font-semibold">Add WebSide to your home screen.</span>{" "}
        <span className="text-muted">
          {ios ? "Tap Share, then “Add to Home Screen”." : "Opens like an app, works on any phone."}
        </span>
      </p>
      {evt ? (
        <button
          type="button"
          onClick={async () => {
            await evt.prompt();
            await evt.userChoice.catch(() => null);
            setHidden(true);
          }}
          className="ws-btn-grad h-9 shrink-0 rounded-xl px-3.5 text-[13px] font-semibold"
        >
          Install
        </button>
      ) : null}
      <button type="button" onClick={dismiss} aria-label="Dismiss" className="rounded-lg p-1.5 text-muted hover:bg-ink-soft hover:text-ink">
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
