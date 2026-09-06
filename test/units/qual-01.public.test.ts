// The qualifying unit's public test. The private half runs the same families with other values.
import { describe, expect, it } from "vitest";
import { exported, loadUnit, unitPresent } from "./_unit.js";

const ID = "qual-01";
type Parse = (line: string) => Record<string, unknown>;
const DID = "did:key:z6MktwupdmLXVVqTzCw4i46r4uGyosGXRnR3XjN4Zq7oMMsw";
const HEX = `0x${"ab".repeat(32)}`;
const OFFER = {
  type: "offer",
  from: DID,
  role: "payer",
  amount: "100",
  asset: "PAPER",
  lock: "hash",
  rails: ["paper"],
  claimByMs: 1_800_000_000_000,
  refundAfterMs: 1_800_000_600_000,
  expiresMs: 1_800_000_300_000,
  nonce: "0123456789abcdef",
  id: HEX,
};
const line = (o: unknown) => `tclk1 ${JSON.stringify(o)}`;

describe.skipIf(!unitPresent(ID))(ID, () => {
  async function parser(): Promise<Parse> {
    return exported<Parse>(
      await loadUnit("src/qual/parse-offer-board-line.ts"),
      "parseOfferBoardLine",
    );
  }

  it("returns kind text for a non-tclk line", async () => {
    const parse = await parser();
    expect(parse("hello world")).toEqual({ kind: "text", text: "hello world" });
    expect(parse("tclk2 {}")).toEqual({ kind: "text", text: "tclk2 {}" });
  });

  it("decodes each frame type with exactly its fields", async () => {
    const parse = await parser();
    expect(parse(line(OFFER))).toEqual({ kind: "frame", ...OFFER });
    const acc = {
      type: "accept",
      from: DID,
      ref: HEX,
      statement: HEX,
      contract: HEX,
      nonce: "ffffffff",
    };
    expect(parse(line(acc))).toEqual({ kind: "frame", ...acc });
    const lock = { type: "lock", from: DID, contract: HEX, rail: "paper", ref: HEX };
    expect(parse(line(lock))).toEqual({ kind: "frame", ...lock });
    const reveal = { type: "reveal", from: DID, contract: HEX, secret: HEX };
    expect(parse(line(reveal))).toEqual({ kind: "frame", ...reveal });
    const refund = { type: "refund", from: DID, contract: HEX, reason: "ghost" };
    expect(parse(line(refund))).toEqual({ kind: "frame", ...refund });
    const cancel = { type: "cancel", from: DID, contract: HEX };
    expect(parse(line(cancel))).toEqual({ kind: "frame", ...cancel });
    const receipt = { type: "receipt", from: DID, contract: HEX, outcome: "claimed" };
    expect(parse(line(receipt))).toEqual({ kind: "frame", ...receipt });
    const hb = { type: "heartbeat", from: DID, contract: HEX, nonce: "00000000" };
    expect(parse(line(hb))).toEqual({ kind: "frame", ...hb });
  });

  it("throws RangeError on multi-line or over-cap input", async () => {
    const parse = await parser();
    expect(() => parse("tclk1 {}\n")).toThrow(RangeError);
    expect(() => parse(`tclk1 ${"x".repeat(4091)}`)).toThrow(RangeError);
  });

  it("throws 'bad frame:' on structural violations", async () => {
    const parse = await parser();
    const bad = [
      "tclk1 not json",
      "tclk1 []",
      line({ ...OFFER, type: "bogus" }),
      line({ ...OFFER, from: "did:web:x" }),
      line({ ...OFFER, extra: 1 }),
      line({ ...OFFER, amount: "0100" }),
      line({ ...OFFER, rails: [] }),
      line({ ...OFFER, claimByMs: OFFER.refundAfterMs }),
      line({ ...OFFER, nonce: "abc" }),
      line({ ...OFFER, id: HEX.toUpperCase() }),
      line({ ...OFFER, lock: "point" }),
      line({ type: "accept", from: DID, ref: HEX, statement: HEX, contract: HEX }),
      line({ type: "receipt", from: DID, contract: HEX, outcome: "won" }),
      line({ type: "reveal", from: DID, contract: HEX, secret: "0x12" }),
      line({ type: "heartbeat", from: DID, contract: HEX, nonce: "0000000", note: 3 }),
    ];
    for (const text of bad) expect(() => parse(text), text).toThrow(/^bad frame:/);
  });
});
