"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { savePageBlocks } from "@/app/dashboard/sites/actions";
import type { PageDraft } from "@/lib/types/blocks";

export type SaveState = "saved" | "saving" | "error";

const DEBOUNCE_MS = 900;

/**
 * Debounced autosave for every page of the site.
 *
 * The previous hook only watched the *active* page, so editing a page and
 * switching tabs inside the debounce window silently dropped the edit — and
 * "Save version" / "Submit" snapshot the database, so they could capture stale
 * content. This hook tracks each page's last-saved content, saves all dirty
 * pages, serialises saves, and exposes `flush()` so callers can wait for the
 * database to be current before snapshotting.
 */
export function useAutosave(tabs: PageDraft[]) {
  const [state, setState] = useState<SaveState>("saved");
  const [error, setError] = useState<string | null>(null);

  const tabsRef = useRef(tabs);
  const lastSaved = useRef(new Map<string, string>());
  const queue = useRef<Promise<boolean>>(Promise.resolve(true));

  // Seed with the server-rendered content so we only save real changes.
  useEffect(() => {
    for (const t of tabs) {
      if (t.id && !lastSaved.current.has(t.id)) {
        lastSaved.current.set(t.id, JSON.stringify(t.blocks));
      }
    }
    tabsRef.current = tabs;
  });

  const dirtyTabs = useCallback(
    () =>
      tabsRef.current.filter(
        (t) => t.id && JSON.stringify(t.blocks) !== lastSaved.current.get(t.id),
      ),
    [],
  );

  const run = useCallback(async (): Promise<boolean> => {
    const dirty = dirtyTabs();
    if (dirty.length === 0) return true;
    setState("saving");
    const results = await Promise.all(
      dirty.map(async (t) => {
        const sent = JSON.stringify(t.blocks);
        const res = await savePageBlocks(t.id!, t.blocks);
        if (res.ok) lastSaved.current.set(t.id!, sent);
        return res;
      }),
    );
    const failed = results.find((r) => !r.ok);
    setError(failed?.error ?? null);
    // Edits made while this save was in flight are picked up by the next run.
    setState(failed ? "error" : "saved");
    return !failed;
  }, [dirtyTabs]);

  /** Save everything that changed. Resolves true when the database is current. */
  const flush = useCallback(() => {
    queue.current = queue.current.then(run, run);
    return queue.current;
  }, [run]);

  /** Tell the hook a freshly-created page is already persisted. */
  const markSaved = useCallback((id: string, blocks: PageDraft["blocks"]) => {
    lastSaved.current.set(id, JSON.stringify(blocks));
  }, []);

  // Debounce on every edit.
  useEffect(() => {
    if (dirtyTabs().length === 0) return;
    const timer = setTimeout(() => void flush(), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [tabs, dirtyTabs, flush]);

  // Warn before leaving with unsaved (or failed-to-save) work.
  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (dirtyTabs().length > 0) e.preventDefault();
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirtyTabs]);

  return { state, error, flush, markSaved };
}
