import type { LockKind } from "./frames.js";
/** A hash lock: the public `hash` statement and its secret `preimage`, both 0x-hex. */
export interface HashLock {
    /** 32-byte preimage. Keep secret until the claim. */
    preimage: string;
    /** sha256(preimage) — safe to publish; the on-chain `Predicate::Hash` statement. */
    hash: string;
}
/** Derive the hash lock for a given 32-byte preimage (0x-hex or bytes). */
export declare function hashLockFromPreimage(preimage: string | Uint8Array): HashLock;
/** Mint a fresh random hash lock. */
export declare function generateHashLock(): HashLock;
/** True iff `sha256(preimage) == hash`. Fail-closed: malformed input is false, never a throw. */
export declare function verifyHashPreimage(hash: string, preimage: string | Uint8Array): boolean;
/** Check a revealed secret against a statement for either lock kind. Fail-closed boolean. */
export declare function verifySecret(lock: LockKind, statement: string, secret: string | Uint8Array): boolean;
/**
 * Payee-side deadline check before accepting an offer, fail-closed like
 * `validateTimelockStagger`: the claim window (now → claimByMs) must cover doing the
 * work and revealing, and the claim→refund gap must cover the rail observing the
 * reveal before the payer may refund. Both margins are the caller's risk tolerance —
 * there is no safe universal default, so none is supplied.
 */
export declare function validateDeadlines(offer: {
    claimByMs: number;
    refundAfterMs: number;
}, nowMs: number, minClaimWindowMs: number, minRefundGapMs: number): boolean;
