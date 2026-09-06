// Raw sign/verify over a canonical string. The signature travels as 86 unpadded
// base64url chars whose last char is one of A, Q, g, w (the low bits are zero).
import { ed25519 } from "@noble/curves/ed25519.js";
import { base64urlnopad } from "@scure/base";
import { publicKeyFromDid } from "./did.js";

export const CANONICAL_SIG_RE = /^[A-Za-z0-9_-]{85}[AQgw]$/;

const utf8 = new TextEncoder();

export function isCanonicalSignature(value: unknown): value is string {
  return typeof value === "string" && CANONICAL_SIG_RE.test(value);
}

/** Sign a canonical string with a 32-byte seed. Deterministic (RFC 8032). */
export function signCanonical(seed: Uint8Array, canonical: string): string {
  const sig = base64urlnopad.encode(ed25519.sign(utf8.encode(canonical), seed));
  if (!CANONICAL_SIG_RE.test(sig)) throw new Error("identity: non-canonical signature");
  return sig;
}

/** Verify a signature against a DID. Fail-closed: malformed input is false, never a throw. */
export function verifyCanonical(did: string, canonical: string, sig: string): boolean {
  if (!CANONICAL_SIG_RE.test(sig)) return false;
  try {
    const publicKey = publicKeyFromDid(did);
    return ed25519.verify(base64urlnopad.decode(sig), utf8.encode(canonical), publicKey);
  } catch {
    return false;
  }
}
