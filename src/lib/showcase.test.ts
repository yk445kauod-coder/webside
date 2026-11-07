import { describe, expect, it } from "vitest";
import { blocksSchema } from "@/lib/schemas";
import { showcaseBlocks } from "@/lib/showcase";

describe("landing showcase", () => {
  it("is valid content the real editor and renderer accept", () => {
    const blocks = showcaseBlocks();
    expect(blocksSchema.safeParse(blocks).success).toBe(true);
    expect(blocks.map((b) => b.kind)).toEqual(["hero", "menu", "contact", "footer"]);
  });
});
