import { describe, expect, it } from "vitest";
import { exported, loadUnit, unitPresent } from "./_unit.js";

const ID = "u-payee-07";
type Chunk = (text: string, opts?: { max?: number; tag?: string }) => string[];

describe.skipIf(!unitPresent(ID))(ID, () => {
  it("folds newlines, sweeps, and cuts to max with the tag on every chunk", async () => {
    const chunk = exported<Chunk>(await loadUnit("src/payee/chunk.ts"), "chunkDeliverable");
    const out = chunk("line one\nline two\n\n  line three\t", { max: 16, tag: "0xab " });
    for (const c of out) {
      expect(c.length).toBeLessThanOrEqual(16);
      expect(c.startsWith("0xab ")).toBe(true);
    }
    expect(out.map((c) => c.slice(5)).join("")).toBe("line one ⏎ line two ⏎ line three");
  });

  it("never splits a surrogate pair and returns one line for empty text", async () => {
    const chunk = exported<Chunk>(await loadUnit("src/payee/chunk.ts"), "chunkDeliverable");
    const text = "ab😀cd😀ef";
    const out = chunk(text, { max: 3 });
    for (const c of out) expect(() => new TextEncoder().encode(c)).not.toThrow();
    for (const c of out) expect(/[\uD800-\uDBFF]$/.test(c)).toBe(false);
    expect(out.join("")).toBe(text);
    expect(chunk("", { tag: "t " })).toEqual(["t "]);
    expect(chunk("x".repeat(8000)).length).toBe(3);
  });
});
