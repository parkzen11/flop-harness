import { describe, expect, it } from "vitest";
import { NotImplementedError } from "../../src/rails/errors.js";
import { FlopHtlcRail } from "../../src/rails/flop-htlc.js";
import type { SettlementRail } from "../../src/rails/types.js";
import { X402Rail } from "../../src/rails/x402.js";
import { makeTerms } from "./contract.js";

async function everyMethodThrowsNotImplemented(rail: SettlementRail, unit: string): Promise<void> {
  const { terms, preimage } = makeTerms({ now: 1_000 });
  const calls: Array<() => Promise<unknown>> = [
    () => rail.lock(terms),
    () => rail.verifyLock(terms, terms.contract),
    () => rail.claim(terms.contract, preimage),
    () => rail.refund(terms.contract),
    () => rail.receipt(terms.contract),
  ];
  for (const call of calls) {
    const error = await call().then(
      () => null,
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(NotImplementedError);
    expect((error as NotImplementedError).unit).toBe(unit);
    expect((error as Error).message).toContain(rail.id);
  }
}

describe("rail stubs", () => {
  it("flop-htlc throws NotImplemented on every method and names its unit", async () => {
    const rail = new FlopHtlcRail();
    expect(rail.id).toBe("flop-htlc");
    await everyMethodThrowsNotImplemented(rail, "u-rails-03");
  });

  it("x402 throws NotImplemented on every method and names its unit", async () => {
    const rail = new X402Rail();
    expect(rail.id).toBe("x402");
    await everyMethodThrowsNotImplemented(rail, "u-rails-04");
  });
});
