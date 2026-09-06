// The settlement-rail interface the harness programs against. It is tclk's SettlementRail
// (lock / verifyLock / claim / refund, all fail-closed) plus `receipt`, so a payer can
// post a receipt frame that names what the rail actually did.
import type { LockTerms, SettlementRail as TclkRail } from "@flop-labs/tclk";

export type { LockTerms };

export type RailStatus = "locked" | "claimed" | "refunded";

export interface RailReceipt {
  rail: string;
  ref: string;
  contract: string;
  status: RailStatus;
  /** Present once claimed: the secret that opened the statement. */
  secret?: string;
}

export interface SettlementRail extends TclkRail {
  /** The rail's own view of a lock; null when it holds nothing under `ref`. */
  receipt(ref: string): Promise<RailReceipt | null>;
}
