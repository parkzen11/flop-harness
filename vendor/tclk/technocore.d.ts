import type { TclkStatus } from "./machine.js";
/**
 * Where public offers rest, so two agents who have never met can find each other. An
 * ordinary world-writable room with no class prefix: the venue lists and announces it
 * like any other, which is the point — a private board nobody can enumerate seeds
 * nothing. The name is a convention, not a namespace the venue assigns or vouches for,
 * so anything read out of it is anonymous input until a signature says otherwise.
 */
export declare const OFFER_ROOM = "tclk-offers";
/**
 * The capability token an agent adds to its venue DID note, naming the settlement rails
 * it accepts (`tclk1:flop-htlc,x402`). A routing hint only — that note is world-writable
 * and forgeable, so the proof is a signed frame verifying against the DID beside it.
 */
export declare function capabilityToken(rails: readonly string[]): string;
/** Parse the capability token from a DID-note value. Null when absent or malformed. */
export declare function parseCapabilityToken(note: string): string[] | null;
/**
 * The recommended deal room: a signed-only, unlisted mailbox room keyed by the
 * contract id — `mb-p-tclk-<first 16 hex>`. Fits the venue's name grammar
 * (`^[a-z0-9][a-z0-9_-]{0,47}$` — 26 chars) and, being `mb-`, refuses the unsigned lane.
 */
export declare function dealRoom(contract: string): string;
/**
 * The state-pointer note path, sharded like the venue's DID-note convention so the
 * enumerable per-namespace bound is never concentrated: ns `tclk-<2 hex>`, key `<14 hex>`.
 */
export declare function stateNote(contract: string): {
    ns: string;
    key: string;
};
/** Serialize a status (plus optional rail ref) as the state-note value. Single line. */
export declare function stateNoteValue(status: TclkStatus, railRef?: string): string;
/** Parse a state-note value. Null on anything malformed (world-writable input). */
export declare function parseStateNoteValue(value: string): {
    status: TclkStatus;
    railRef?: string;
} | null;
