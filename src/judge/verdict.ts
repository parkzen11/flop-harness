// One verdict shape for every judge: rules, LLM, sandbox. `pass` is the only field a rail
// acts on; `reasons` is what gets posted to the deliveries room; the rest is evidence.
import { z } from "zod";

export const VerdictSchema = z.object({
  pass: z.boolean(),
  reasons: z.array(z.string().min(1)).min(1),
  /** 0..1 when the judge grades; omitted when it only decides. */
  score: z.number().min(0).max(1).optional(),
  /** Which judge produced it: "exact", "rules", "llm", "sandbox", "arbiter". */
  judge: z.string().min(1),
  unit_id: z.string().optional(),
  contract: z
    .string()
    .regex(/^0x[0-9a-f]{64}$/)
    .optional(),
  coverage: z.number().min(0).max(100).optional(),
  changed_lines: z.number().int().nonnegative().optional(),
  at: z.string().datetime().optional(),
});

export type Verdict = z.infer<typeof VerdictSchema>;

export function parseVerdict(value: unknown): Verdict {
  return VerdictSchema.parse(value);
}

export function isVerdict(value: unknown): value is Verdict {
  return VerdictSchema.safeParse(value).success;
}
