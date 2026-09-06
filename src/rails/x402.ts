// The x402 (HTTP 402, USDC on Base) rail. Same stub discipline as flop-htlc.
import { NotImplementedError } from "./errors.js";
import type { LockTerms, RailReceipt, SettlementRail } from "./types.js";

const UNIT = "u-rails-04";

export class X402Rail implements SettlementRail {
  readonly id = "x402";

  lock(_terms: LockTerms): Promise<string> {
    return Promise.reject(new NotImplementedError(this.id, "lock", UNIT));
  }
  verifyLock(_terms: LockTerms, _ref: string): Promise<boolean> {
    return Promise.reject(new NotImplementedError(this.id, "verifyLock", UNIT));
  }
  claim(_ref: string, _secret: string): Promise<void> {
    return Promise.reject(new NotImplementedError(this.id, "claim", UNIT));
  }
  refund(_ref: string): Promise<void> {
    return Promise.reject(new NotImplementedError(this.id, "refund", UNIT));
  }
  receipt(_ref: string): Promise<RailReceipt | null> {
    return Promise.reject(new NotImplementedError(this.id, "receipt", UNIT));
  }
}
