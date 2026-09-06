// Deterministic tclk frames for unit tests: fixed nonces, fixed clock, real ids.
import {
  encodeFrame,
  generateHashLock,
  makeAccept,
  makeOffer,
  type AcceptFrame,
  type OfferFrame,
  type TclkFrame,
} from "@flop-labs/tclk";
import type { VenueMessage } from "../../src/venue/types.js";

export const NOW = Date.UTC(2026, 8, 6, 12, 0, 0);
export const PAYER = "did:key:z6MktwupdmLXVVqTzCw4i46r4uGyosGXRnR3XjN4Zq7oMMsw";
export const PAYEE = "did:key:z6MktULudTtAsAhRegYPiZ6631RV3viv12qd4GQF8z1xB22S";
export const SIG = "x".repeat(85) + "A";

export interface DecodedFrame {
  seq: number;
  ts: string;
  frame: TclkFrame;
  verified: boolean;
}

export function offer(over: Partial<Parameters<typeof makeOffer>[0]> = {}): OfferFrame {
  return makeOffer({
    from: PAYER,
    role: "payer",
    amount: "100",
    asset: "PAPER",
    lock: "hash",
    rails: ["paper"],
    claimByMs: NOW + 30 * 60_000,
    refundAfterMs: NOW + 60 * 60_000,
    expiresMs: NOW + 10 * 60_000,
    job: {
      proto: "flop-harness",
      id: "u-test-01",
      context: "do the thing | full spec: /kv/tclk-job-01/u-test-01",
    },
    nonce: "0123456789abcdef",
    ...over,
  });
}

export function accept(o: OfferFrame, from = PAYEE): AcceptFrame {
  return makeAccept(o, { from, statement: generateHashLock().hash, nonce: "fedcba9876543210" });
}

export function message(
  seq: number,
  frame: TclkFrame,
  opts: { from?: string; signed?: boolean } = {},
): VenueMessage {
  const from = opts.from ?? frame.from;
  const signed = opts.signed ?? true;
  return {
    seq,
    ts: new Date(NOW + seq * 1000).toISOString(),
    from,
    text: encodeFrame(frame),
    sig: signed ? SIG : null,
    nonce: String(seq),
  };
}

export function decoded(seq: number, frame: TclkFrame, verified = true): DecodedFrame {
  return { seq, ts: new Date(NOW + seq * 1000).toISOString(), frame, verified };
}
