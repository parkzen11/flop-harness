import { describe, expect, it } from "vitest";
import { seedFromHex, isSeedHex, newSeed, seedToHex } from "../../src/identity/keys.js";
import {
  CANONICAL_SIG_RE,
  isCanonicalSignature,
  signCanonical,
  verifyCanonical,
} from "../../src/identity/sign.js";
import vectors from "../fixtures/identity-vectors.json" with { type: "json" };

describe("sign / verify", () => {
  for (const [name, v] of Object.entries(vectors)) {
    it(`reproduces the donor fleet's message signature (${name})`, () => {
      const sig = signCanonical(seedFromHex(v.seed), v.message.canonical);
      expect(sig).toBe(v.message.sig);
      expect(sig).toMatch(CANONICAL_SIG_RE);
      expect(verifyCanonical(v.did, v.message.canonical, sig)).toBe(true);
    });

    it(`reproduces the donor fleet's note signature (${name})`, () => {
      expect(signCanonical(seedFromHex(v.seed), v.note.canonical)).toBe(v.note.sig);
    });
  }

  it("fails closed on a wrong DID, wrong text, or malformed signature", () => {
    const v = vectors.rfc8032;
    expect(verifyCanonical(vectors.ones.did, v.message.canonical, v.message.sig)).toBe(false);
    expect(verifyCanonical(v.did, v.message.canonical + "!", v.message.sig)).toBe(false);
    expect(verifyCanonical(v.did, v.message.canonical, "nope")).toBe(false);
    expect(verifyCanonical("did:web:x", v.message.canonical, v.message.sig)).toBe(false);
    expect(isCanonicalSignature(v.message.sig)).toBe(true);
    expect(isCanonicalSignature(v.message.sig.slice(0, -1) + "B")).toBe(false);
  });
});

describe("seeds", () => {
  it("round-trips hex", () => {
    const seed = newSeed();
    expect(seed).toHaveLength(32);
    expect(seedFromHex(seedToHex(seed))).toEqual(seed);
  });

  it("rejects bad hex", () => {
    expect(isSeedHex("abc")).toBe(false);
    expect(() => seedFromHex("zz".repeat(32))).toThrow("64 hex");
  });
});
