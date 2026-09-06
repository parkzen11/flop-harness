import { describe, expect, it } from "vitest";
import { exactMatch, ExactMatchJudge } from "../../src/judge/exact-match.js";
import { normalizeText, referenceTokens } from "../../src/judge/normalize.js";
import { VerdictSchema } from "../../src/judge/verdict.js";

const spec = { ask: "How many rooms?", done: "one number", answer: "20 rooms per IP" };

describe("exactMatch", () => {
  it("fails an empty deliverable outright", () => {
    const v = exactMatch({ spec, deliverables: ["  ", ""] });
    expect(v).toMatchObject({ pass: false, score: 0, judge: "exact" });
    expect(VerdictSchema.safeParse(v).success).toBe(true);
  });

  it("passes an exact or verbatim-contained answer", () => {
    expect(exactMatch({ spec, deliverables: ["20 ROOMS per ip"] })?.pass).toBe(true);
    expect(
      exactMatch({ spec, deliverables: ["The cap is 20 rooms per IP, nominal."] })?.reasons[0],
    ).toContain("exact match");
  });

  it("passes when every reference token is present in any order", () => {
    const v = exactMatch({ spec, deliverables: ["per IP the venue allows 20 (rooms)"] });
    expect(v?.pass).toBe(true);
    expect(v?.reasons[0]).toContain("all reference values");
  });

  it("returns null when it cannot decide", () => {
    expect(exactMatch({ spec: { ask: "x", done: "y" }, deliverables: ["anything"] })).toBeNull();
    expect(exactMatch({ spec, deliverables: ["forty rooms"] })).toBeNull();
    expect(exactMatch({ spec: { ...spec, answer: "!!" }, deliverables: ["x"] })).toBeNull();
  });
});

describe("ExactMatchJudge", () => {
  it("turns null into a failing verdict with the reason", async () => {
    const judge = new ExactMatchJudge();
    expect(judge.id).toBe("exact");
    const noAnswer = await judge.judge({ spec: { ask: "x", done: "y" }, deliverables: ["z"] });
    expect(noAnswer).toMatchObject({
      pass: false,
      reasons: ["no reference answer; the exact-match judge cannot decide"],
    });
    const wrong = await judge.judge({ spec, deliverables: ["forty"] });
    expect(wrong.reasons[0]).toContain("does not contain");
    const right = await judge.judge({ spec, deliverables: ["20 rooms per IP"] });
    expect(right.pass).toBe(true);
  });
});

describe("normalize", () => {
  it("lowercases, strips punctuation except . and , and collapses spaces", () => {
    expect(normalizeText("  Hello,  WORLD! 3.5 (x)  ")).toBe("hello, world 3.5 x");
    expect(referenceTokens("a, bb cc,3.5")).toEqual(["bb", "cc", "3.5"]);
  });
});
