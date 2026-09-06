import { describe, expect, it } from "vitest";
import { MemoryNoteStore, PaperRail } from "../../src/rails/paper.js";
import { makeTerms, railContractSuite } from "./contract.js";

railContractSuite(
  "paper (MemoryNoteStore)",
  (clock) => new PaperRail(new MemoryNoteStore(), () => clock.now),
);

describe("PaperRail specifics", () => {
  it("records onto the sharded tclk-paper note so a stranger can read the rehearsal", async () => {
    const notes = new MemoryNoteStore();
    const clock = { now: 5_000 };
    const rail = new PaperRail(notes, () => clock.now);
    const { terms } = makeTerms(clock, "cd");
    const ref = await rail.lock(terms);
    expect(ref).toBe(terms.contract);
    const raw = notes.raw("tclk-paper-cd", "cd".repeat(7));
    expect(raw).toBe(`tclkpaper1 locked hash ${terms.statement} ${terms.refundAfterMs}`);
    expect(rail.id).toBe("paper");
  });
});
