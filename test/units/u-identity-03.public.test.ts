import { describe, expect, it } from "vitest";
import { DetachedSigner } from "../../src/identity/signer.js";
import vectors from "../fixtures/identity-vectors.json" with { type: "json" };
import { exported, loadUnit, unitPresent } from "./_unit.js";

const ID = "u-identity-03";
type Parts = { did: string; sig: string; nonce: string; text: string };
type SignedNoteUrlParts = (
  s: DetachedSigner,
  ns: string,
  key: string,
  nonce: string | number,
  value: string,
) => Parts;
type CasNoteQuery = (c: { ifAbsent?: true; if?: string }) => string;

describe.skipIf(!unitPresent(ID))(ID, () => {
  const v = vectors.rfc8032;
  const signer = DetachedSigner.fromSeedHex(v.seed);

  it("signedNoteUrlParts reproduces the golden note signature", async () => {
    const mod = await loadUnit("src/identity/notes.ts");
    const parts = exported<SignedNoteUrlParts>(mod, "signedNoteUrlParts");
    expect(parts(signer, v.note.ns, v.note.key, v.note.nonce, v.note.value)).toEqual({
      did: v.did,
      sig: v.note.sig,
      nonce: "3",
      text: "x",
    });
    expect(parts(signer, v.note.ns, v.note.key, 3, " x\t").text).toBe("x");
  });

  it("rejects bad names and long values before signing", async () => {
    const mod = await loadUnit("src/identity/notes.ts");
    const parts = exported<SignedNoteUrlParts>(mod, "signedNoteUrlParts");
    expect(() => parts(signer, "Bad", "k", 1, "v")).toThrow();
    expect(() => parts(signer, "ns", "k", 1, "v".repeat(4097))).toThrow();
  });

  it("casNoteQuery emits the venue's if_absent / if query", async () => {
    const mod = await loadUnit("src/identity/notes.ts");
    const cas = exported<CasNoteQuery>(mod, "casNoteQuery");
    expect(cas({ ifAbsent: true })).toBe("if_absent=1");
    expect(cas({ if: "locked 0xab" })).toBe("if=locked+0xab");
    expect(cas({})).toBe("");
  });
});
