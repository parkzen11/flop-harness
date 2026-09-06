import { describe, expect, it } from "vitest";
import { DuplicateGuard } from "../../src/venue/dedupe.js";
import { WriteBudget } from "../../src/venue/write-budget.js";

describe("WriteBudget", () => {
  it("allows perMinute writes in a sliding window and says when the next frees", () => {
    let now = 1_000;
    const b = new WriteBudget({ perMinute: 3, clock: () => now });
    expect(b.take()).toEqual({ ok: true, remaining: 2 });
    now = 2_000;
    expect(b.take()).toEqual({ ok: true, remaining: 1 });
    expect(b.take()).toEqual({ ok: true, remaining: 0 });
    expect(b.take()).toEqual({ ok: false, retryAfterMs: 59_000 });
    now = 61_001;
    expect(b.remaining()).toBe(1);
    expect(b.take()).toEqual({ ok: true, remaining: 0 });
  });

  it("refuses a zero budget", () => {
    expect(() => new WriteBudget({ perMinute: 0 })).toThrow("at least one");
  });
});

describe("DuplicateGuard", () => {
  it("allows five copies in 120 s and refuses the sixth", () => {
    let now = 0;
    const g = new DuplicateGuard({ clock: () => now });
    for (let i = 0; i < 5; i += 1) {
      expect(g.check("same")).toEqual({ ok: true, copies: i });
      g.note("same");
    }
    expect(g.check("same")).toEqual({ ok: false, copies: 5 });
    expect(g.check("other")).toEqual({ ok: true, copies: 0 });
    now = 120_001;
    expect(g.check("same")).toEqual({ ok: true, copies: 0 });
  });

  it("uses the configured window and threshold", () => {
    const g = new DuplicateGuard({ maxCopies: 1, windowMs: 10, clock: () => 5 });
    g.note("x");
    expect(g.check("x").ok).toBe(false);
  });
});
