import { describe, expect, it } from "vitest";
import type { VenueMessage } from "../../src/venue/types.js";
import { accept, message, offer, PAYEE } from "./_frames.js";
import { exported, loadUnit, unitPresent } from "./_unit.js";

const ID = "u-recorder-03";
interface Sweep {
  frames: Record<string, number>;
  malformed: Array<{ seq: number; reason: string }>;
  unverified: number;
  nonTclk: number;
}
type DecodeSweep = (messages: VenueMessage[]) => Sweep;

const o = offer();
const a = accept(o);
const plain = (seq: number, text: string): VenueMessage => ({
  seq,
  ts: "2026-09-06T00:00:00Z",
  from: "~bob",
  text,
  sig: null,
  nonce: null,
});
const lines: VenueMessage[] = [
  message(1, o),
  message(2, a),
  message(3, o, { signed: false }),
  message(4, a, { from: PAYEE + "x" }),
  plain(5, "hello"),
  plain(6, 'tclk1 {"type":"offer"}'),
  plain(7, "tclk1 not json"),
];

describe.skipIf(!unitPresent(ID))(ID, () => {
  it("counts frames by type, malformed with reasons, unverified and non-tclk lines", async () => {
    const decodeSweep = exported<DecodeSweep>(
      await loadUnit("src/recorder/sweep.ts"),
      "decodeSweep",
    );
    const out = decodeSweep(lines);
    expect(out.frames).toEqual({ offer: 1, accept: 1 });
    expect(out.unverified).toBe(2);
    expect(out.nonTclk).toBe(1);
    expect(out.malformed.map((m) => m.seq)).toEqual([6, 7]);
    expect(out.malformed[0]?.reason).toMatch(/missing field|malformed|must/);
    expect(out.malformed[1]?.reason).toMatch(/JSON/i);
  });

  it("never throws on an empty or hostile input", async () => {
    const decodeSweep = exported<DecodeSweep>(
      await loadUnit("src/recorder/sweep.ts"),
      "decodeSweep",
    );
    expect(decodeSweep([])).toEqual({ frames: {}, malformed: [], unverified: 0, nonTclk: 0 });
    expect(() => decodeSweep([plain(1, "tclk1 " + "{".repeat(5000))])).not.toThrow();
  });
});
