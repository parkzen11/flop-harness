// The free path: when a spec carries a private reference answer, decide without a model.
// Pass when the deliverable equals the answer, contains it verbatim, or contains every
// reference token. Returns null when it cannot decide (no answer, or no match) so a
// costlier judge can take over; wrap it in ExactMatchJudge to make null a fail.
import { normalizeText, referenceTokens } from "./normalize.js";
import type { Judge, JudgeInput } from "./types.js";
import type { Verdict } from "./verdict.js";

export const EXACT_JUDGE_ID = "exact";

export function exactMatch(input: JudgeInput): Verdict | null {
  const text = input.deliverables.join("\n").trim();
  if (text === "") {
    return { pass: false, score: 0, reasons: ["no deliverable posted"], judge: EXACT_JUDGE_ID };
  }
  const answer = input.spec.answer;
  if (answer === undefined) return null;
  const a = normalizeText(answer);
  const d = normalizeText(text);
  if (a === "") return null;
  if (d === a || (a.length >= 2 && d.includes(a))) {
    return pass("exact match against the reference answer (no judge call)");
  }
  const tokens = referenceTokens(answer);
  if (tokens.length >= 2 && tokens.every((token) => d.includes(token))) {
    return pass("all reference values present in the deliverable (no judge call)");
  }
  return null;
}

function pass(reason: string): Verdict {
  return { pass: true, score: 1, reasons: [reason], judge: EXACT_JUDGE_ID };
}

export class ExactMatchJudge implements Judge {
  readonly id = EXACT_JUDGE_ID;

  judge(input: JudgeInput): Promise<Verdict> {
    const verdict = exactMatch(input);
    if (verdict !== null) return Promise.resolve(verdict);
    const why =
      input.spec.answer === undefined
        ? "no reference answer; the exact-match judge cannot decide"
        : "deliverable does not contain the reference answer";
    return Promise.resolve({ pass: false, score: 0, reasons: [why], judge: this.id });
  }
}
