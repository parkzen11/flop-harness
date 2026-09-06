import { describe, expect, it } from "vitest";
import type { Judge } from "../../src/judge/types.js";
import { VerdictSchema } from "../../src/judge/verdict.js";
import { exported, loadUnit, unitPresent } from "./_unit.js";

const ID = "u-judge-01";
type Ctor = new (opts?: { minChars?: number; forbidden?: string[] }) => Judge;
const spec = {
  ask: "From https://technocore.chat/llms.txt state the dupe window",
  done: "one number",
};
const long =
  "The DUPLICATES section of the document says the window is 120 seconds and the copy threshold is 5 copies.";

describe.skipIf(!unitPresent(ID))(ID, () => {
  it("fails short and evasive deliverables with one reason per rule", async () => {
    const Rules = exported<Ctor>(await loadUnit("src/judge/rules.ts"), "RulesJudge");
    const judge = new Rules();
    expect(judge.id).toBe("rules");
    const short = await judge.judge({ spec, deliverables: ["120"] });
    expect(short.pass).toBe(false);
    expect(short.reasons.some((r) => /short|80/.test(r))).toBe(true);
    const evasive = await judge.judge({
      spec,
      deliverables: [`As an AI I cannot browse. ${long}`],
    });
    expect(evasive.pass).toBe(false);
    expect(evasive.reasons.some((r) => /as an ai/i.test(r))).toBe(true);
    expect(VerdictSchema.safeParse(evasive).success).toBe(true);
  });

  it("passes a structural deliverable at 0.5 and a source-quoting one at 1", async () => {
    const Rules = exported<Ctor>(await loadUnit("src/judge/rules.ts"), "RulesJudge");
    const judge = new Rules();
    const plain = await judge.judge({ spec, deliverables: [long] });
    expect(plain).toMatchObject({ pass: true, score: 0.5 });
    const quoted = await judge.judge({
      spec,
      deliverables: [`"window: 120s" (https://technocore.chat/llms.txt). ${long}`],
    });
    expect(quoted).toMatchObject({ pass: true, score: 1 });
  });

  it("accepts an honest not-found only when it names the cited source", async () => {
    const Rules = exported<Ctor>(await loadUnit("src/judge/rules.ts"), "RulesJudge");
    const judge = new Rules({ minChars: 10 });
    const honest = await judge.judge({
      spec,
      deliverables: ["Not found in the cited source: https://technocore.chat/llms.txt"],
    });
    expect(honest.pass).toBe(true);
    const lazy = await judge.judge({
      spec,
      deliverables: ["Not found in the cited source: https://example.com"],
    });
    expect(lazy.pass).toBe(false);
  });
});
