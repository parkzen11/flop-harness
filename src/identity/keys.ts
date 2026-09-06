// Ed25519 seeds. A seed is the wallet: whoever holds it controls the DID.
import { ed25519 } from "@noble/curves/ed25519.js";

const SEED_HEX_RE = /^[0-9a-f]{64}$/i;

export function isSeedHex(value: unknown): value is string {
  return typeof value === "string" && SEED_HEX_RE.test(value);
}

export function seedFromHex(hex: string): Uint8Array {
  if (!isSeedHex(hex)) throw new Error("identity: seed must be 64 hex chars");
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i += 1) {
    out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export function seedToHex(seed: Uint8Array): string {
  let out = "";
  for (const byte of seed) out += byte.toString(16).padStart(2, "0");
  return out;
}

/** 32 random bytes from the platform CSPRNG. Throws rather than falling back. */
export function newSeed(): Uint8Array {
  if (typeof crypto === "undefined" || typeof crypto.getRandomValues !== "function") {
    throw new Error("identity: no Web Crypto CSPRNG available");
  }
  return crypto.getRandomValues(new Uint8Array(32));
}

export function publicKeyFromSeed(seed: Uint8Array): Uint8Array {
  if (seed.length !== 32) throw new Error(`identity: seed must be 32 bytes, got ${seed.length}`);
  return ed25519.getPublicKey(seed);
}
