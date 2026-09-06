import { describe, expect, it } from "vitest";
import { accept, decoded, NOW, offer, PAYEE, PAYER, type DecodedFrame } from "./_frames.js";
import { exported, loadUnit, unitPresent } from "./_unit.js";

const ID = "u-payee-01";
interface Opts {
  selfDid?: string;
  rails?: string[];
  minClaimMs?: number;
  minGapMs?: number;
  ignoreAccepts?: Set<string>;
  allowAccepted?: (payer: string) => boolean;
  lockedOffers?: Set<string>;
}
type OpenPayerOffers = (frames: DecodedFrame[], nowMs: number, opts?: Opts) => DecodedFrame[];

const good = offer();
const expired = offer({ expiresMs: NOW - 1, nonce: "1111111111111111" });
const payeeSide = offer({ role: "payee", from: PAYEE, nonce: "2222222222222222" });
const x402Only = offer({ rails: ["x402"], nonce: "3333333333333333" });
const shortClaim = offer({
  claimByMs: NOW + 60_000,
  refundAfterMs: NOW + 61_000,
  nonce: "4444444444444444",
});
const taken = offer({ nonce: "5555555555555555" });
const takenAccept = accept(taken, PAYEE);
const JUNK = "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK";
const junkTaken = offer({ nonce: "6666666666666666" });
const junkAccept = accept(junkTaken, JUNK);

const frames: DecodedFrame[] = [
  decoded(1, good),
  decoded(2, expired),
  decoded(3, payeeSide),
  decoded(4, x402Only),
  decoded(5, shortClaim),
  decoded(6, taken),
  decoded(7, takenAccept),
  decoded(8, junkTaken),
  decoded(9, junkAccept),
  decoded(10, offer({ nonce: "7777777777777777" }), false),
];
const ids = (out: DecodedFrame[]) => out.map((x) => (x.frame.type === "offer" ? x.frame.id : "?"));

describe.skipIf(!unitPresent(ID))(ID, () => {
  it("keeps only verified, unexpired, hash-locked payer offers on a shared rail with safe deadlines", async () => {
    const mod = await loadUnit("src/payee/open-offers.ts");
    const open = exported<OpenPayerOffers>(mod, "openPayerOffers");
    expect(ids(open(frames, NOW))).toEqual([good.id]);
  });

  it("honours rails, ignoreAccepts, allowAccepted, lockedOffers and selfDid", async () => {
    const mod = await loadUnit("src/payee/open-offers.ts");
    const open = exported<OpenPayerOffers>(mod, "openPayerOffers");
    expect(ids(open(frames, NOW, { rails: ["x402", "paper"] }))).toEqual([good.id, x402Only.id]);
    expect(ids(open(frames, NOW, { ignoreAccepts: new Set([JUNK]) }))).toEqual([
      good.id,
      junkTaken.id,
    ]);
    expect(ids(open(frames, NOW, { allowAccepted: (p) => p === PAYER }))).toEqual([
      good.id,
      taken.id,
      junkTaken.id,
    ]);
    expect(ids(open(frames, NOW, { lockedOffers: new Set([good.id]) }))).toEqual([]);
    expect(ids(open(frames, NOW, { selfDid: PAYER }))).toEqual([]);
    expect(ids(open(frames, NOW, { minClaimMs: 1, minGapMs: 1 }))).toEqual([
      good.id,
      shortClaim.id,
    ]);
  });
});
