import { describe, expect, it } from "vitest";
import { isVerdict, parseVerdict } from "../../src/judge/verdict.js";

describe("Verdict schema", () => {
  it("accepts the judge pipeline's verdict.json shape", () => {
    const v = parseVerdict({
      unit_id: "u-venue-01",
      pass: true,
      reasons: ["lint clean", "tests green", "coverage 84.2%", "changed 120 lines"],
      judge: "sandbox",
      coverage: 84.2,
      changed_lines: 120,
      at: "2026-09-06T00:00:00Z",
    });
    expect(v.pass).toBe(true);
    expect(v.changed_lines).toBe(120);
  });

  it("requires at least one reason and bounds the score", () => {
    expect(isVerdict({ pass: false, reasons: [], judge: "exact" })).toBe(false);
    expect(isVerdict({ pass: true, reasons: ["x"], judge: "llm", score: 1.5 })).toBe(false);
    expect(isVerdict({ pass: true, reasons: ["x"], judge: "llm", contract: "0x12" })).toBe(false);
    expect(() => parseVerdict({ pass: "yes" })).toThrow();
  });
});
