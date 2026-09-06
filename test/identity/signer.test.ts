import { describe, expect, it } from "vitest";
import { DetachedSigner, signMessage, signNote } from "../../src/identity/signer.js";
import { verifyCanonical } from "../../src/identity/sign.js";
import vectors from "../fixtures/identity-vectors.json" with { type: "json" };

describe("DetachedSigner (airlock)", () => {
  const v = vectors.rfc8032;
  const signer = DetachedSigner.fromSeedHex(v.seed);

  it("exposes the DID and signs the golden vector", () => {
    expect(signer.did).toBe(v.did);
    expect(signer.sign(v.message.canonical)).toBe(v.message.sig);
  });

  it("never exposes the seed", () => {
    expect(Object.keys(signer)).toEqual(["did", "sign"]);
    expect(JSON.stringify(signer)).toBe(JSON.stringify({ did: v.did }));
    expect(Object.isFrozen(signer)).toBe(true);
    expect(JSON.stringify(signer)).not.toContain(v.seed);
  });

  it("copies the seed so the caller's buffer can be wiped", () => {
    const seed = Uint8Array.from(Buffer.from(v.seed, "hex"));
    const s = DetachedSigner.fromSeed(seed);
    seed.fill(0);
    expect(s.sign(v.message.canonical)).toBe(v.message.sig);
  });
});

describe("signMessage / signNote", () => {
  const v = vectors.rfc8032;
  const signer = DetachedSigner.fromSeedHex(v.seed);

  it("sweeps the text and signs the message canonical", () => {
    const out = signMessage(signer, v.message.room, v.message.nonce, v.message.text);
    expect(out.text).toBe(v.message.swept);
    expect(out.canonical).toBe(v.message.canonical);
    expect(out.sig).toBe(v.message.sig);
    expect(out.nonce).toBe("7");
    expect(verifyCanonical(signer.did, out.canonical, out.sig)).toBe(true);
  });

  it("signs the note canonical", () => {
    const n = v.note;
    const out = signNote(signer, n.ns, n.key, n.nonce, n.value);
    expect(out.canonical).toBe(n.canonical);
    expect(out.sig).toBe(n.sig);
  });
});
