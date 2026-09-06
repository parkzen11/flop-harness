import type { LockKind } from "./frames.js";
import type { LockTerms, SettlementRail } from "./rail.js";
/** The record version, so a later shape cannot be mistaken for this one. */
export declare const PAPER_RECORD_PREFIX: "tclkpaper1";
/**
 * The note surface the paper rail records onto. Kept as an interface so the library
 * stays free of network code: the caller supplies the venue transport (see the
 * walkthrough in examples/), and tests supply a map.
 *
 * `set` returns false when a conditional write loses — the venue answers 409 and carries
 * the value that is actually there.
 */
export interface NoteStore {
    get(ns: string, key: string): Promise<string | null>;
    set(ns: string, key: string, value: string, condition?: {
        ifAbsent: true;
    } | {
        if: string;
    }): Promise<boolean>;
}
export type PaperStatus = "locked" | "claimed" | "refunded";
export interface PaperRecord {
    status: PaperStatus;
    lock: LockKind;
    statement: string;
    refundAfterMs: number;
    /** Present once claimed — the secret is public by then anyway, it was the claim. */
    secret?: string;
}
/**
 * Serialize a record to one note line. Single-line and space-separated so a human, a
 * shell, or an agent with only a fetch tool can read the state without a parser.
 */
export declare function encodePaperRecord(record: PaperRecord): string;
/**
 * Parse a note line. Null on anything malformed — this namespace is world-writable, so
 * every read is anonymous input and a bad line must not throw inside a polling loop.
 */
export declare function decodePaperRecord(value: string): PaperRecord | null;
/** Where a contract's paper record lives, sharded like the state note. */
export declare function paperNote(contract: string): {
    ns: string;
    key: string;
};
/**
 * A rail that records the lock/claim/refund lifecycle and backs it with nothing.
 *
 * It enforces the same predicates a real rail must — one lock per contract, claim only
 * with a secret that opens the statement and only strictly before `refundAfterMs`, refund
 * only at or after it — so a client written against this rail is written correctly. What
 * it cannot do is make any of that binding on a counterparty, because no value is at
 * stake and the record is world-writable.
 */
export declare class PaperRail implements SettlementRail {
    readonly id = "paper";
    private readonly notes;
    private readonly clock;
    constructor(notes: NoteStore, clock?: () => number);
    lock(terms: LockTerms): Promise<string>;
    verifyLock(terms: LockTerms, ref: string): Promise<boolean>;
    claim(ref: string, secret: string): Promise<void>;
    refund(ref: string): Promise<void>;
    /** The record as it stands, or null when absent or unparseable. */
    read(ref: string): Promise<PaperRecord | null>;
    private requireLocked;
    /**
     * Move the record with a compare-and-set against the exact bytes read. That closes the
     * lost-update race between two of your own workers; it does NOT fence a stranger, who
     * can overwrite this note at any point — the venue orders writes, it does not own them.
     */
    private advance;
}
/** An in-memory NoteStore, for tests and for a dry run with no network. */
export declare class MemoryNoteStore implements NoteStore {
    private readonly values;
    get(ns: string, key: string): Promise<string | null>;
    set(ns: string, key: string, value: string, condition?: {
        ifAbsent: true;
    } | {
        if: string;
    }): Promise<boolean>;
    /** Test helper: the raw stored line, exactly as a reader of the venue would see it. */
    raw(ns: string, key: string): string | undefined;
}
