import type { TclkFrame } from "./frames.js";
import type { ContractState } from "./machine.js";
/** One venue message with the transport record kept beside its line. */
export interface TranscriptRecord {
    room: string;
    seq: number;
    timestampMs: number;
    sender: string;
    nonce: string | null;
    signature: string | null;
    line: string;
}
export type RecordVerdict = { ok: true } | { ok: false; reason: string };
export declare function verifyTranscriptRecord(record: TranscriptRecord): RecordVerdict;
export declare function transcriptRecord(room: string, value: unknown): TranscriptRecord;
export declare function parseTranscriptExport(room: string, jsonl: string): TranscriptRecord[];
export interface ContractHandshake {
    offer: TranscriptRecord;
    accept: TranscriptRecord;
    offerFrame: TclkFrame;
    acceptFrame: TclkFrame;
}
export declare function findContractHandshake(records: readonly TranscriptRecord[], contract: string): ContractHandshake | null;
export interface FoldResult {
    state: ContractState;
    applied: TranscriptRecord[];
    rejected: Array<{ record: TranscriptRecord; reason: string }>;
}
export declare function foldTranscript(records: readonly TranscriptRecord[], contract: string): FoldResult;
