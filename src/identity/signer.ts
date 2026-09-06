// The airlock: a Signer exposes a DID and a sign() function and nothing else. The seed
// lives in a closure that no property, method or serialization can reach. Code that
// talks to the venue takes a Signer, never a seed, so a bug in the venue client cannot
// leak the key.
import { canonicalMessage, canonicalNote, sweep } from "./canonical.js";
import { didFromPublicKey } from "./did.js";
import { publicKeyFromSeed, seedFromHex } from "./keys.js";
import { signCanonical } from "./sign.js";

export interface Signer {
  readonly did: string;
  /** Sign an already-canonical string (see canonical.ts). */
  sign(canonical: string): string;
}

export interface SignedText {
  /** The text after the venue sweep; this is what was signed and what the venue stores. */
  text: string;
  sig: string;
  nonce: string;
  canonical: string;
}

export class DetachedSigner implements Signer {
  readonly did: string;
  readonly sign: (canonical: string) => string;

  private constructor(did: string, sign: (canonical: string) => string) {
    this.did = did;
    this.sign = sign;
    Object.freeze(this);
  }

  static fromSeed(seed: Uint8Array): DetachedSigner {
    const copy = Uint8Array.from(seed);
    const did = didFromPublicKey(publicKeyFromSeed(copy));
    return new DetachedSigner(did, (canonical) => signCanonical(copy, canonical));
  }

  static fromSeedHex(hex: string): DetachedSigner {
    return DetachedSigner.fromSeed(seedFromHex(hex));
  }

  /** Never leak the seed through JSON.stringify or console.log. */
  toJSON(): { did: string } {
    return { did: this.did };
  }
}

/** Sign a room message the way the venue verifies it. */
export function signMessage(
  signer: Signer,
  room: string,
  nonce: string | number,
  text: string,
): SignedText {
  const swept = sweep(text);
  const canonical = canonicalMessage(room, nonce, swept);
  return { text: swept, sig: signer.sign(canonical), nonce: String(nonce), canonical };
}

/** Sign a kv note the way the venue verifies it. */
export function signNote(
  signer: Signer,
  ns: string,
  key: string,
  nonce: string | number,
  value: string,
): SignedText {
  const swept = sweep(value);
  const canonical = canonicalNote(ns, key, nonce, swept);
  return { text: swept, sig: signer.sign(canonical), nonce: String(nonce), canonical };
}
