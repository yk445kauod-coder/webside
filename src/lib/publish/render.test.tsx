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
