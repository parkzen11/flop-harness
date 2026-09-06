/** An encrypted (pre-)signature under a statement `T`: announced nonce `R̂` and `ŝ`. */
export interface PreSignature {
    /** Announced nonce point R̂ = r·G (33-byte SEC1 hex). */
    nonce: string;
    /** Pre-signature scalar ŝ = r + e·d (mod n), 0x-hex. */
    s: string;
}
/** A completed signature (R, s): a valid full-Schnorr signature once adapted. */
export interface Signature {
    /** Nonce point R = R̂ + T (33-byte SEC1 hex). */
    nonce: string;
    /** Signature scalar s = ŝ + t (mod n), 0x-hex. */
    s: string;
}
/** The signer's SEC1-compressed public key `P = d·G` for a 32-byte secret key, or `null`
 *  if the key is malformed (bad hex / zero / out of range). Fail-closed, like the rest of
 *  the library (`verifyPointWitness`) — never throws on bad input. */
export declare function getPublicKey(secretKey: string): string | null;
/**
 * Produce a pre-signature on `msg` under statement `T` (33-byte SEC1 point), or `null` if
 * `secretKey` or `statement` is malformed. The challenge binds the *decrypted* nonce
 * `R̂ + T`, so the pre-signature is only completable into a valid signature by someone who
 * knows the witness `t` for `T`.
 */
export declare function preSign(secretKey: string, msg: string | Uint8Array, statement: string): PreSignature | null;
/** Complete a pre-signature with the witness `t` into a full-Schnorr signature, or `null`
 *  if `pre` or `witness` is malformed. */
export declare function adapt(pre: PreSignature, witness: string): Signature | null;
/**
 * Extract the witness `t = s − ŝ (mod n)` from a pre-signature and its completed
 * signature, or `null` if either scalar is malformed. This is the on-chain → off-chain
 * bridge: `t` opens `Point(T)`.
 */
export declare function extractWitness(pre: PreSignature, sig: Signature): string | null;
/** Verify a pre-signature: `ŝ·G == R̂ + e·P` with `e = H((R̂+T)‖P‖m)`. */
export declare function verifyPreSignature(publicKey: string, msg: string | Uint8Array, statement: string, pre: PreSignature): boolean;
/** Verify a completed full-Schnorr signature: `s·G == R + e·P`, `e = H(R‖P‖m)`. */
export declare function verifySignature(publicKey: string, msg: string | Uint8Array, sig: Signature): boolean;
