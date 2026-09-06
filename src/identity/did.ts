// did:key for Ed25519, as the technocore signed lane verifies it:
// multicodec prefix 0xed01 + 32-byte public key, base58btc, "z" multibase.
import { base58 } from "@scure/base";

const DID_PREFIX = "did:key:z";
const MULTICODEC_ED25519 = Uint8Array.from([0xed, 0x01]);

/** The exact shape the venue and tclk accept: 56 chars, always starts with z6Mk. */
export const DID_RE = /^did:key:z6Mk[1-9A-HJ-NP-Za-km-z]{44}$/;

export function isDidKey(value: unknown): value is string {
  return typeof value === "string" && DID_RE.test(value);
}

export function didFromPublicKey(publicKey: Uint8Array): string {
  if (publicKey.length !== 32) {
    throw new Error(`identity: ed25519 public key must be 32 bytes, got ${publicKey.length}`);
  }
  const tagged = new Uint8Array(2 + publicKey.length);
  tagged.set(MULTICODEC_ED25519, 0);
  tagged.set(publicKey, 2);
  return `${DID_PREFIX}${base58.encode(tagged)}`;
}

export function publicKeyFromDid(did: string): Uint8Array {
  if (!did.startsWith(DID_PREFIX)) throw new Error("identity: not a did:key");
  const tagged = base58.decode(did.slice(DID_PREFIX.length));
  if (tagged.length !== 34 || tagged[0] !== 0xed || tagged[1] !== 0x01) {
    throw new Error("identity: not an ed25519 did:key");
  }
  return tagged.slice(2);
}

/** The last characters of a DID, the way the venue and logs abbreviate it. */
export function didTail(did: string, chars = 8): string {
  return did.slice(-chars);
}
