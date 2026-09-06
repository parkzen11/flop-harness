import { describe, expect, it } from "vitest";
import { didFromPublicKey, didTail, isDidKey, publicKeyFromDid } from "../../src/identity/did.js";
import { publicKeyFromSeed, seedFromHex } from "../../src/identity/keys.js";
import vectors from "../fixtures/identity-vectors.json" with { type: "json" };

const RFC_SEED = "9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60";
const RFC_PUBLIC = "d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a";

function hex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

describe("did:key", () => {
  it("derives the RFC 8032 test-vector public key from its seed", () => {
    expect(hex(publicKeyFromSeed(seedFromHex(RFC_SEED)))).toBe(RFC_PUBLIC);
  });

  it("encodes the donor fleet's DID for the same seed (golden vector)", () => {
    const did = didFromPublicKey(publicKeyFromSeed(seedFromHex(vectors.rfc8032.seed)));
    expect(did).toBe(vectors.rfc8032.did);
    expect(isDidKey(did)).toBe(true);
  });

  it("round-trips public key -> DID -> public key", () => {
    const pub = publicKeyFromSeed(seedFromHex(vectors.ones.seed));
    expect(hex(publicKeyFromDid(didFromPublicKey(pub)))).toBe(hex(pub));
  });

  it("rejects non-ed25519 and malformed DIDs", () => {
    expect(() => publicKeyFromDid("did:web:example.com")).toThrow("not a did:key");
    expect(() =>
      publicKeyFromDid("did:key:zQ3shokFTS3brHcDQrn82RUDfCZESWL1ZdCEJwekUDPQiYBme"),
    ).toThrow("not an ed25519");
    expect(isDidKey("did:key:z6Mk")).toBe(false);
    expect(isDidKey(42)).toBe(false);
    expect(() => didFromPublicKey(new Uint8Array(31))).toThrow("32 bytes");
  });

  it("abbreviates with didTail", () => {
    expect(didTail(vectors.ones.did)).toBe(vectors.ones.did.slice(-8));
    expect(didTail(vectors.ones.did, 4)).toHaveLength(4);
  });
});
