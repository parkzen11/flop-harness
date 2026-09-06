import { type OfferFrame, type PresigRef, type TclkFrame } from "./frames.js";
export type TclkStatus = "proposed" | "accepted" | "locked" | "claimed" | "refunded" | "cancelled";
export declare const TCLK_TERMINAL_STATUSES: ReadonlySet<TclkStatus>;
export interface ContractState {
    status: TclkStatus;
    offer: OfferFrame;
    payerDid?: string;
    payeeDid?: string;
    payerKey?: string;
    payeeKey?: string;
    contract?: string;
    statement?: string;
    rail?: string;
    railRef?: string;
    presig?: PresigRef;
    secret?: string;
}
export interface StepResult {
    state: ContractState;
    ok: boolean;
    reason?: string;
}
export declare function openContract(offer: OfferFrame): ContractState;
export declare function applyFrame(state: ContractState, frame: TclkFrame, nowMs: number): StepResult;
