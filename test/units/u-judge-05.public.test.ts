import { describe, expect, it } from "vitest";
import type { Verdict } from "../../src/judge/verdict.js";
import { exported, loadUnit, unitPresent } from "./_unit.js";

const ID = "u-judge-05";
type Format = (contract: string, v: Verdict) => string;
type Parse = (
  line: string,
) => { contract: string; pass: boolean; score?: number; judge: string; reasons: string[] } | null;
const CONTRACT = `0x${"ab".repeat(32)}`;

describe.skipIf(!unitPresent(ID))(ID, () => {
  it("formats one swept line and parses it back", async () => {
    const mod = await loadUnit("src/judge/verdict-line.ts");
    const format = exported<Format>(mod, "formatVerdictLine");
    const parse = exported<Parse>(mod, "parseVerdictLine");
    const v: Verdict = {
      pass: true,
      score: 1,
      judge: "exact",
      reasons: ["exact match", "no judge call"],
    };
    const line = format(CONTRACT, v);
    expect(line).toBe(`${CONTRACT} verdict PASS score=1 judge=exact | exact match; no judge call`);
    expect(parse(line)).toEqual({
      contract: CONTRACT,
      pass: true,
      score: 1,
      judge: "exact",
      reasons: ["exact match", "no judge call"],
    });
    const fail: Verdict = { pass: false, judge: "sandbox", reasons: ["lint\nfailed"] };
    const failLine = format(CONTRACT, fail);
    expect(failLine).toBe(`${CONTRACT} verdict FAIL score=- judge=sandbox | lint failed`);
    expect(parse(failLine)).toEqual({
      contract: CONTRACT,
      pass: false,
      judge: "sandbox",
      reasons: ["lint failed"],
    });
  });

  it("caps the line and rejects junk", async () => {
    const mod = await loadUnit("src/judge/verdict-line.ts");
    const format = exported<Format>(mod, "formatVerdictLine");
    const parse = exported<Parse>(mod, "parseVerdictLine");
    expect(
      format(CONTRACT, { pass: false, judge: "llm", reasons: ["x".repeat(5000)] }).length,
    ).toBeLessThanOrEqual(3800);
    expect(() => format("0x12", { pass: true, judge: "exact", reasons: ["r"] })).toThrow();
    expect(parse("hello")).toBeNull();
    expect(parse(`${CONTRACT} verdict MAYBE score=1 judge=x | r`)).toBeNull();
    expect(parse(`0x12 verdict PASS score=1 judge=x | r`)).toBeNull();
  });
});
