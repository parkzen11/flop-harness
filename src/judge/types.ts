import type { Verdict } from "./verdict.js";

/** What a payer asked for. `answer` and `quote` are private: never shown to the payee. */
export interface TaskSpec {
  ask: string;
  done: string;
  answer?: string;
  quote?: string;
}

export interface JudgeInput {
  spec: TaskSpec;
  /** The deliverable lines, in order, as posted in the deal room. */
  deliverables: readonly string[];
}

export interface Judge {
  readonly id: string;
  judge(input: JudgeInput): Promise<Verdict>;
}
