// The rail contract: every SettlementRail must pass this suite. A new rail adds one
// `railContractSuite("name", factory)` call and nothing else.
import { generateHashLock } from "@flop-labs/tclk";
import { describe, expect, it } from "vitest";
import type { LockTerms, SettlementRail } from "../../src/rails/types.js";

export interface Clock {
  now: number;
}

export function makeTerms(
  clock: Clock,
  contractByte = "aa",
): { terms: LockTerms; preimage: string } {
  const lock = generateHashLock();
  const terms: LockTerms = {
    contract: `0x${contractByte.repeat(32)}`,
    lock: "hash",
    statement: lock.hash,
    amount: "100",
    asset: "PAPER",
    payer: "did:key:z6MktwupdmLXVVqTzCw4i46r4uGyosGXRnR3XjN4Zq7oMMsw",
    payee: "did:key:z6MktULudTtAsAhRegYPiZ6631RV3viv12qd4GQF8z1xB22S",
    claimByMs: clock.now + 60_000,
    refundAfterMs: clock.now + 120_000,
  };
  return { terms, preimage: lock.preimage };
}

export function railContractSuite(name: string, factory: (clock: Clock) => SettlementRail): void {
  describe(`rail contract: ${name}`, () => {
    it("locks once, verifies the exact terms, and refuses a second lock", async () => {
      const clock = { now: 1_000 };
      const rail = factory(clock);
      const { terms } = makeTerms(clock);
      const ref = await rail.lock(terms);
      expect(await rail.verifyLock(terms, ref)).toBe(true);
      expect(await rail.verifyLock({ ...terms, refundAfterMs: terms.refundAfterMs + 1 }, ref)).toBe(
        false,
      );
      await expect(rail.lock(terms)).rejects.toThrow();
      expect(await rail.receipt(ref)).toMatchObject({ rail: rail.id, ref, status: "locked" });
    });

    it("claims only with the secret that opens the statement, before refundAfterMs", async () => {
      const clock = { now: 1_000 };
      const rail = factory(clock);
      const { terms, preimage } = makeTerms(clock);
      const ref = await rail.lock(terms);
      await expect(rail.claim(ref, `0x${"00".repeat(32)}`)).rejects.toThrow("secret");
      await rail.claim(ref, preimage);
      expect(await rail.receipt(ref)).toMatchObject({ status: "claimed", secret: preimage });
      expect(await rail.verifyLock(terms, ref)).toBe(false);
      await expect(rail.claim(ref, preimage)).rejects.toThrow();
    });

    it("refunds only at or after refundAfterMs, and never a claimed lock", async () => {
      const clock = { now: 1_000 };
      const rail = factory(clock);
      const { terms, preimage } = makeTerms(clock);
      const ref = await rail.lock(terms);
      await expect(rail.refund(ref)).rejects.toThrow("before refundAfterMs");
      clock.now = terms.refundAfterMs;
      await expect(rail.claim(ref, preimage)).rejects.toThrow("after refundAfterMs");
      await rail.refund(ref);
      expect(await rail.receipt(ref)).toMatchObject({ status: "refunded" });
      await expect(rail.refund(ref)).rejects.toThrow();
    });

    it("refuses to lock into an open refund window and knows nothing about unknown refs", async () => {
      const clock = { now: 1_000 };
      const rail = factory(clock);
      const { terms } = makeTerms(clock);
      clock.now = terms.refundAfterMs;
      await expect(rail.lock(terms)).rejects.toThrow("refund window");
      expect(await rail.receipt(`0x${"bb".repeat(32)}`)).toBeNull();
      await expect(rail.claim(`0x${"bb".repeat(32)}`, "0x00")).rejects.toThrow("unknown");
    });
  });
}
