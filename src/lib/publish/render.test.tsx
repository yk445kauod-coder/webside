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
  it("needs a home page", () => {
    const r = renderSite("cafe", "C", { a: { title: "A", path: "/a", blocks: [] } });
    expect("error" in r).toBe(true);
  });
});
