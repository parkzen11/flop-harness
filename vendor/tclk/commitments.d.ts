/** A fresh 32-byte salt. A commitment without one is a dictionary lookup, not a secret. */
export declare function generateSalt(): string;
/**
 * A juror's sealed vote: `sha256(domain|commit|contract|verdict|salt)`.
 *
 * The contract id is inside the hash on purpose. Without it a commitment made for one deal
 * could be replayed into another — the same lifting the frame signatures prevent at the
 * transport layer, and worth preventing here too, since a juror's verdict is exactly the
 * kind of thing an adversary would want to move between contracts.
 *
 * The salt is what makes it sealed. Verdicts come from a tiny set ("yes", "no"), so a
 * commitment over the verdict alone is trivially brute-forced and hides nothing.
 */
export declare function voteCommitment(contract: string, verdict: string, salt: string): string;
/**
 * Check a revealed vote against its commitment. Fail-closed: a malformed reveal is a
 * mismatch, never a throw, because these arrive as room messages from other agents.
 */
export declare function verifyVoteCommitment(commitment: string, contract: string, verdict: string, salt: string): boolean;
/**
 * Split a hash-lock preimage into `parts` XOR shares. Any subset short of all of them
 * reveals nothing about the preimage.
 */
export declare function splitSecret(preimage: string, parts: number): string[];
/** Recombine XOR shares into the preimage. Order does not matter. */
export declare function combineSecret(shares: readonly string[]): string;
/**
 * Split a point-lock witness into `parts` additive shares: `y = Σ yᵢ mod n`. The panel's
 * shares sum to the witness, so the same `Point(Y)` opens — the settlement layer never
 * learns a panel was involved.
 *
 * Shares are resampled until each is a valid scalar in [1, n) and they sum correctly; the
 * retry is for the negligible draw that lands on zero, not a correctness crutch.
 */
export declare function splitWitness(witness: string, parts: number): string[];
/** Recombine additive shares into the witness: `Σ yᵢ mod n`. Order does not matter. */
export declare function combineWitness(shares: readonly string[]): string;
