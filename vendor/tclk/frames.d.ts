export declare const TCLK_VERSION: "tclk/1";
export declare const TCLK_PREFIX: "tclk1 ";
export declare const TCLK_DOMAIN: "FLOP::tclk::v1";
/** Technocore's message cap: a frame must fit one single-line room message. */
export declare const MAX_FRAME_CHARS = 4096;
export type LockKind = "hash" | "point";
/** Binding to an external job the contract pays for (A2A task, Virtuals ACP job, …). */
export interface JobRef {
    proto: string;
    id: string;
    context?: string;
}
export interface OfferFields {
    type: "offer";
    from: string;
    role: "payer" | "payee";
    /** Decimal integer string, rail-native minimal units. */
    amount: string;
    asset: string;
    lock: LockKind;
    rails: string[];
    claimByMs: number;
    refundAfterMs: number;
    expiresMs: number;
    paymentKey?: string;
    job?: JobRef;
    nonce: string;
}
export interface OfferFrame extends OfferFields {
    id: string;
}
export interface AcceptFrame {
    type: "accept";
    from: string;
    ref: string;
    statement: string;
    contract: string;
    paymentKey?: string;
    nonce: string;
}
export interface PresigRef {
    nonce: string;
    s: string;
}
export interface LockFrame {
    type: "lock";
    from: string;
    contract: string;
    rail: string;
    ref: string;
    presig?: PresigRef;
}
export interface RevealFrame {
    type: "reveal";
    from: string;
    contract: string;
    ref?: string;
    secret: string;
}
export interface RefundFrame {
    type: "refund";
    from: string;
    contract: string;
    ref?: string;
    reason?: string;
}
export interface CancelFrame {
    type: "cancel";
    from: string;
    contract: string;
    reason?: string;
}
export interface ReceiptFrame {
    type: "receipt";
    from: string;
    contract: string;
    outcome: "claimed" | "refunded" | "cancelled";
    rail?: string;
    ref?: string;
}
export interface HeartbeatFrame {
    type: "heartbeat";
    from: string;
    contract: string;
    nonce: string;
    note?: string;
}
export type TclkFrame = OfferFrame | AcceptFrame | LockFrame | RevealFrame | RefundFrame | CancelFrame | ReceiptFrame | HeartbeatFrame;
export declare function canonicalJson(value: unknown): string;
export declare function offerId(fields: OfferFields): string;
export interface AcceptCore {
    from: string;
    ref: string;
    statement: string;
    paymentKey?: string;
    nonce: string;
}
export declare function contractId(offer: OfferFrame, accept: AcceptCore): string;
export declare function isValidStatement(lock: LockKind, statement: string): boolean;
export declare function validateFrame(value: unknown): TclkFrame;
export declare function makeOffer(fields: Omit<OfferFields, "type" | "nonce"> & {
    nonce?: string;
}): OfferFrame;
export declare function makeHeartbeat(fields: Omit<HeartbeatFrame, "type" | "nonce"> & {
    nonce?: string;
}): HeartbeatFrame;
export declare function makeAccept(offer: OfferFrame, accept: {
    from: string;
    statement: string;
    paymentKey?: string;
    nonce?: string;
}): AcceptFrame;
export declare function isTclkLine(text: string): boolean;
export declare function encodeFrame(frame: TclkFrame): string;
export declare function decodeFrame(text: string): TclkFrame;
export declare function tryDecodeFrame(text: string): TclkFrame | null;
