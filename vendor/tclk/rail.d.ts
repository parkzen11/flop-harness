import type { ContractState } from "./machine.js";
import type { LockKind } from "./frames.js";
/** The rail-facing projection of an accepted contract. */
export interface LockTerms {
    contract: string;
    lock: LockKind;
    statement: string;
    amount: string;
    asset: string;
    payer: string;
    payee: string;
    claimByMs: number;
    refundAfterMs: number;
}
/** Project an accepted (or later) contract state onto its rail terms. Throws before accept. */
export declare function lockTerms(state: ContractState): LockTerms;
export interface SettlementRail {
    /** Rail id as advertised in `offer.rails` (e.g. "flop-htlc", "x402"). */
    readonly id: string;
    /** Escrow the funds under the terms; returns the rail-specific reference. */
    lock(terms: LockTerms): Promise<string>;
    /** True iff `ref` holds a live lock matching `terms` exactly. Fail-closed. */
    verifyLock(terms: LockTerms, ref: string): Promise<boolean>;
    /** Release to the payee — only with the secret that opens the statement. */
    claim(ref: string, secret: string): Promise<void>;
    /** Return to the payer — only at/after refundAfterMs. */
    refund(ref: string): Promise<void>;
}
type MemoryLockStatus = "locked" | "claimed" | "refunded";
/**
 * In-process reference rail. Enforces exactly the predicates every real rail must:
 * one lock per contract, claim only with a verifying secret strictly before
 * refundAfterMs, refund only at/after it, and both only from the "locked" state.
 * All violations throw (fail closed).
 */
export declare class MemoryRail implements SettlementRail {
    readonly id: string;
    private readonly locks;
    private readonly clock;
    constructor(id?: string, clock?: () => number);
    lock(terms: LockTerms): Promise<string>;
    verifyLock(terms: LockTerms, ref: string): Promise<boolean>;
    claim(ref: string, secret: string): Promise<void>;
    refund(ref: string): Promise<void>;
    /** Test/inspection helper: the rail's view of one lock. */
    status(ref: string): MemoryLockStatus | undefined;
    private requireLocked;
}
export {};
