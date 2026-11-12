"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Puck, createUsePuck } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import { LayoutList, Pencil, Plus, Sparkles, X } from "lucide-react";
import { conf } from "@/puck";
import { toItems } from "@/puck/legacy";
import { AiEditChat } from "@/components/editor/ai-edit-chat";
import type { Item } from "@/lib/site-agent";
import type { AnyBlock } from "@/lib/types/blocks";

const usePuck = createUsePuck();

/** Plain-Arabic names for the block library, so the owner never has to read English. */
const AR: Record<string, string> = {
  Hero: "الغلاف الرئيسي", FeatureGrid: "شبكة مميزات", Card: "كارت", CTA: "دعوة لإجراء", FAQ: "أسئلة شائعة",
  Steps: "خطوات", FeatureSplit: "صورة ونص", Bento: "مربعات", Logos: "شعارات", Stats: "أرقام",
  Grid: "شبكة", Flex: "صف", Space: "مسافة", Heading: "عنوان", Text: "نص", Button: "زر",
  Menu: "قائمة / منيو", Contact: "تواصل", Image: "صورة", Theme: "الألوان والخط",
};
const CONFIG = {
  ...conf,
  components: Object.fromEntries(Object.entries(conf.components).map(([k, v]) => [k, { ...(v as object), label: AR[k] ?? (v as { label?: string }).label ?? k }])),
};

type Tab = "add" | "layers" | "edit" | "ai" | null;
const TabCtx = createContext<(t: Tab) => void>(() => {});

function useIsPhone() {
  const [phone, setPhone] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const on = () => setPhone(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return phone;
}

/** Tapping a block adds it to the end of the page, so adding never needs a drag. */
function TapToAdd({ name, children }: { name: string; children: ReactNode }) {
  const dispatch = usePuck((s) => s.dispatch);
  const count = usePuck((s) => s.appState.data.content.length);
  const setTab = useContext(TabCtx);
  return (
    <div className="cursor-pointer" onClick={() => {
      dispatch({ type: "insert", componentType: name, destinationIndex: count, destinationZone: "root:default-zone" });
      setTab(null);
    }}>{children}</div>
  );
}

function AiPanel() {
  const content = usePuck((s) => s.appState.data.content) as unknown as Item[];
  const dispatch = usePuck((s) => s.dispatch);
  return <AiEditChat items={content} onItems={(next) => dispatch({ type: "setData", data: { content: next as never } })} />;
}

const TABS: { id: Exclude<Tab, null>; label: string; Icon: typeof Plus }[] = [
  { id: "add", label: "إضافة", Icon: Plus },
  { id: "layers", label: "ترتيب", Icon: LayoutList },
  { id: "edit", label: "تعديل", Icon: Pencil },
  { id: "ai", label: "مساعد AI", Icon: Sparkles },
];

/** Phone layout: page on top, one tool sheet below, a big always-visible tab bar at the bottom. */
function PhoneShell({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const selected = usePuck((s) => s.selectedItem);
  // Tapping a block in the page opens its fields.
  useEffect(() => { if (selected) setTab("edit"); }, [selected?.props?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div dir="rtl" className="flex h-full flex-col bg-canvas">
      <div className="relative min-h-0 flex-1 overflow-hidden"><Puck.Preview /></div>
      {tab ? (
        <section className="flex h-[46dvh] min-h-0 flex-col border-t border-line bg-surface shadow-[0_-8px_24px_rgba(0,0,0,.12)]">
          <div className="flex items-center justify-between px-3 py-1.5">
            <p className="text-sm font-bold">{TABS.find((t) => t.id === tab)?.label}</p>
            <button type="button" onClick={() => setTab(null)} aria-label="إغلاق" className="grid size-10 place-items-center rounded-lg"><X className="size-5" aria-hidden /></button>
          </div>
          <div className="ws-phone-tool min-h-0 flex-1 overflow-y-auto">
            {tab === "add" ? <Puck.Components /> : null}
            {tab === "layers" ? <Puck.Outline /> : null}
            {tab === "edit" ? (selected ? <Puck.Fields /> : <p className="p-4 text-sm text-muted">اضغط على أي جزء في الصفحة فوق عشان تعدّله.</p>) : null}
            {tab === "ai" ? <AiPanel /> : null}
          </div>
        </section>
      ) : null}
      <nav className="grid grid-cols-4 border-t border-line bg-white pb-[env(safe-area-inset-bottom)]" aria-label="أدوات المحرر">
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} type="button" onClick={() => setTab(tab === id ? null : id)} aria-pressed={tab === id}
            className={"flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-semibold " + (tab === id ? "text-orange" : "text-ink")}>
            <Icon className="size-5" aria-hidden />{label}
          </button>
        ))}
      </nav>
    </div>
  );
}

function DesktopAi() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen((o) => !o)} className="fixed bottom-4 end-4 z-40 inline-flex items-center gap-2 rounded-full bg-ink px-4 py-3 text-sm font-semibold text-canvas shadow-lg">
        <Sparkles className="size-4 text-orange" aria-hidden /> مساعد AI
      </button>
      {open ? <div className="fixed bottom-20 end-4 z-40 flex h-[28rem] w-96 max-w-[calc(100vw-2rem)] flex-col rounded-2xl border border-line bg-canvas shadow-2xl"><AiPanel /></div> : null}
    </>
  );
}

/**
 * Puck (MIT) is the editor, with its own block library. Pages are stored as Puck items
 * ({type, props}); old WebSide blocks are converted on load so existing sites keep working.
 * Stored in pages.blocks, so autosave, revisions, SUDO review and publishing are unchanged.
 */
export function PuckCanvas({ pageKey, blocks, onBlocks }: { pageKey: string; blocks: AnyBlock[]; onBlocks: (blocks: AnyBlock[]) => void }) {
  // Only re-seed Puck when the page changes, never on our own edits.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initial = useMemo(() => ({ root: { props: {} }, content: toItems(blocks as unknown[]) }), [pageKey]);
  const phone = useIsPhone();
  const [tab, setTab] = useState<Tab>(null);
  return (
    <TabCtx.Provider value={setTab}>
      <div className="ws-puck absolute inset-0">
        <Puck
          key={pageKey}
          config={CONFIG as never}
          data={initial as never}
          onChange={(d) => onBlocks(d.content as unknown as AnyBlock[])}
          headerPath=""
          overrides={{
            header: () => <></>,
            headerActions: () => <></>,
            componentItem: ({ name, children }) => <TapToAdd name={name}>{children}</TapToAdd>,
          }}
        >
          {phone ? <PhoneShell tab={tab} setTab={setTab} /> : <><Puck.Layout /><DesktopAi /></>}
        </Puck>
      </div>
    </TabCtx.Provider>
  );
}
