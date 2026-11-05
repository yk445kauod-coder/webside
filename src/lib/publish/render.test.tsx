// @vitest-environment node
import { describe, expect, it } from "vitest";
import { prefixLinks, renderSite } from "./render";
import { pathSegments, validatePublishSlug } from "./slug";

const block = (extra: object) => ({ id: "b1", style: "light", ...extra }) as never;

describe("slug", () => {
  it("rejects reserved and malformed", () => {
    expect(validatePublishSlug("dashboard")).toBeTruthy();
    expect(validatePublishSlug("_next")).toBeTruthy();
    expect(validatePublishSlug("A b")).toBeTruthy();
    expect(validatePublishSlug("a--b")).toBeTruthy();
    expect(validatePublishSlug("-ab")).toBeTruthy();
    expect(validatePublishSlug("cafe-nile")).toBeNull();
  });
  it("sanitises page paths", () => {
    expect(pathSegments("/")).toEqual([]);
    expect(pathSegments("/about")).toEqual(["about"]);
    expect(pathSegments("/../x")).toBeNull();
    expect(pathSegments("about")).toBeNull();
  });
});

describe("renderSite", () => {
  it("prefixes root-relative links only", () => {
    expect(prefixLinks('<a href="/about">a</a><a href="//x.com">b</a><a href="https://x">c</a>', "s")).toBe(
      '<a href="/s/about">a</a><a href="//x.com">b</a><a href="https://x">c</a>',
    );
  });
  it("renders a home page with an escaped title and nav for several pages", () => {
    const r = renderSite("cafe", "Café <b>", {
      home: { title: "Home", path: "/", blocks: [block({ kind: "heading", text: "Hello", level: 2, align: "left" })] },
      about: { title: "About", path: "/about", blocks: [block({ kind: "paragraph", text: "Hi", align: "left" })] },
    });
    if ("error" in r) throw new Error(r.error);
    expect(r.files.map((f) => f.path)).toEqual(["sites/cafe/index.html", "sites/cafe/about/index.html"]);
    expect(r.files[0].content).toContain("Café &lt;b&gt;");
    expect(r.files[0].content).toContain('href="/cafe/about/"');
    expect(r.files[0].content).toContain('href="/cafe/"');
    expect(r.files[0].content).not.toContain("/cafe/cafe/");
    expect(r.files[0].content).toContain("Hello");
  });
  it("adds canonical, description and Open Graph tags", () => {
    const r = renderSite("cafe", "Cafe", {
      home: {
        title: "Home",
        path: "/",
        blocks: [
          block({ kind: "hero", title: "Hi", subtitle: "Fresh coffee, \"daily\".", align: "left" }),
          block({ kind: "image", src: "https://img.example/a.jpg", alt: "a", caption: "" }),
        ],
      },
      about: { title: "About", path: "/about", blocks: [] },
    });
    if ("error" in r) throw new Error(r.error);
    const home = r.files[0].content;
    expect(home).toContain('<link rel="canonical" href="https://web-side.pages.dev/cafe/">');
    expect(home).toContain('content="Fresh coffee, &quot;daily&quot;."');
    expect(home).toContain('property="og:image" content="https://img.example/a.jpg"');
    expect(r.files[1].content).toContain('href="https://web-side.pages.dev/cafe/about/"');
  });
  it("needs a home page", () => {
    const r = renderSite("cafe", "C", { a: { title: "A", path: "/a", blocks: [] } });
    expect("error" in r).toBe(true);
  });
});

describe("menu rendering", () => {
  const menu = (view: string, name = "Tea") =>
    block({
      kind: "menu",
      title: "Menu",
      currency: "EGP",
      view,
      categories: [
        { name: "Drinks", items: [{ name, description: "Hot", price: "20", image: "", badge: "New", available: true }] },
        { name: "Cakes", items: [{ name: "Cake", description: "", price: "40", image: "", badge: "", available: false }] },
      ],
    });
  const html = (view: string, name?: string) => {
    const r = renderSite("cafe", "Cafe", { home: { title: "Home", path: "/", blocks: [menu(view, name)] } });
    if ("error" in r) throw new Error(r.error);
    return r.files[0].content;
  };

  it("renders every view as static html with prices and sold-out state", () => {
    for (const view of ["list", "grid", "compact", "tabs"]) {
      const h = html(view);
      expect(h).toContain("Tea");
      expect(h).toContain("20");
      expect(h).toContain("EGP");
      expect(h).toContain("Sold out");
    }
  });

  it("tabs view links to category anchors that exist", () => {
    const h = html("tabs");
    const href = /href="#(menu-[a-zA-Z0-9-]+)"/.exec(h);
    expect(href).toBeTruthy();
    expect(h).toContain(`id="${href![1]}"`);
  });

  it("escapes item names", () => {
    expect(html("list", "<script>x</script>")).not.toContain("<script>x</script>");
  });

  it("marks mostly-Arabic sites rtl", () => {
    const r = renderSite("ar", "قهوة", {
      home: { title: "الرئيسية", path: "/", blocks: [block({ kind: "paragraph", text: "أهلا بكم في مقهانا", align: "left" })] },
    });
    if ("error" in r) throw new Error(r.error);
    expect(r.files[0].content).toContain('<html lang="ar" dir="rtl">');
    expect(r.files[0].content).toContain("IBM+Plex+Sans+Arabic");
  });
});

describe("large menus", () => {
  it("adds search for big menus and none for small ones", () => {
    const mk = (n: number) =>
      block({
        kind: "menu", title: "M", currency: "", view: "list",
        categories: [{ name: "A", items: Array.from({ length: n }, (_, i) => ({ name: `i${i}`, description: "", price: "1", image: "", badge: "", available: true })) }],
      });
    const run = (n: number) => {
      const r = renderSite("s", "S", { home: { title: "H", path: "/", blocks: [mk(n)] } });
      if ("error" in r) throw new Error(r.error);
      return r.files[0].content;
    };
    expect(run(200)).toContain("data-menu-search");
    expect(run(5)).not.toContain("data-menu-search");
  });
});

describe("contact block", () => {
  const contact = (extra: object = {}) =>
    block({
      kind: "contact",
      title: "Find us",
      phone: "+20 10 1234 5678",
      whatsapp: "01012345678",
      address: "12 Nile St",
      mapUrl: "https://maps.example.com/x",
      hours: [{ day: "Sat - Thu", time: "10:00 - 22:00" }],
      qrUrl: "https://wa.me/201012345678",
      ...extra,
    });
  const html = (b: never) => {
    const r = renderSite("cafe", "Cafe", { home: { title: "Home", path: "/", blocks: [b] } });
    if ("error" in r) throw new Error(r.error);
    return r.files.map((f) => f.content.toString()).join("\n");
  };
  it("renders WhatsApp, phone, hours and an inline QR without scripts", () => {
    const h = html(contact());
    expect(h).toContain("https://wa.me/201012345678");
    expect(h).toContain('href="tel:+201012345678"');
    expect(h).toContain("10:00 - 22:00");
    expect(h).toContain("<svg");
    expect(h).toContain("aria-label=\"QR code\"");
  });
  it("drops hostile links and omits the QR when empty", () => {
    const h = html(contact({ qrUrl: "", mapUrl: "javascript:alert(1)", whatsapp: "x" }));
    expect(h).not.toContain("javascript:");
    expect(h).not.toContain("QR code");
    expect(h).not.toContain("wa.me");
  });
});
