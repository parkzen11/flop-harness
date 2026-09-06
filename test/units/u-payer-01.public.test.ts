import { validateFrame } from "@flop-labs/tclk";
import { describe, expect, it } from "vitest";
import { DetachedSigner } from "../../src/identity/signer.js";
import vectors from "../fixtures/identity-vectors.json" with { type: "json" };
import { NOW } from "./_frames.js";
import { exported, loadUnit, unitPresent } from "./_unit.js";

const ID = "u-payer-01";
interface Built {
  offer: {
    id: string;
    from: string;
    amount: string;
    asset: string;
    rails: string[];
    job?: { proto: string; id: string; context?: string };
    claimByMs: number;
    refundAfterMs: number;
    expiresMs: number;
  };
  specNote: { ns: string; key: string; value: string };
}
type BuildOffer = (p: {
  signer: DetachedSigner;
  amount: string;
  asset?: string;
  rails?: string[];
  spec: string;
  taskId: string;
  claimMin?: number;
  refundMin?: number;
  expireMin?: number;
  nowMs: number;
}) => Built;

describe.skipIf(!unitPresent(ID))(ID, () => {
  const signer = DetachedSigner.fromSeedHex(vectors.rfc8032.seed);

  it("builds a valid offer with the inline context and the spec note address", async () => {
    const buildOffer = exported<BuildOffer>(await loadUnit("src/payer/offer.ts"), "buildOffer");
    const spec =
      "protocol | From llms.txt list the room-class prefixes | done looks like: 4 entries";
    const out = buildOffer({ signer, amount: "200", spec, taskId: "u-venue-01.b7", nowMs: NOW });
    expect(() => validateFrame(out.offer)).not.toThrow();
    expect(out.offer.from).toBe(signer.did);
    expect(out.offer.amount).toBe("200");
    expect(out.offer.asset).toBe("PAPER");
    expect(out.offer.rails).toEqual(["paper"]);
    expect(out.specNote).toEqual({ ns: "tclk-job-b7", key: "u-venue-01b7", value: spec });
    expect(out.offer.job).toEqual({
      proto: "flop-harness",
      id: "u-venue-01.b7",
      context: `${spec} | full spec: /kv/tclk-job-b7/u-venue-01b7`,
    });
    expect(out.offer.claimByMs).toBe(NOW + 30 * 60_000);
    expect(out.offer.refundAfterMs).toBe(NOW + 60 * 60_000);
    expect(out.offer.expiresMs).toBe(NOW + 10 * 60_000);
  });

  it("cuts a long spec to 300 chars in the context and sanitises the note address", async () => {
    const buildOffer = exported<BuildOffer>(await loadUnit("src/payer/offer.ts"), "buildOffer");
    const spec = "x".repeat(1000);
    const out = buildOffer({
      signer,
      amount: "1",
      spec,
      taskId: "A!B",
      nowMs: NOW,
      claimMin: 5,
      refundMin: 6,
      expireMin: 1,
    });
    expect(out.specNote.ns).toBe("tclk-job-00");
    expect(out.specNote.key).toBe("B");
    expect(out.offer.job?.context).toBe(`${"x".repeat(300)} | full spec: /kv/tclk-job-00/B`);
  });
});
