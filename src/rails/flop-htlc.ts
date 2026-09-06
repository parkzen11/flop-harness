// The FLOP-network HTLC rail. Upstream has not shipped it; this stub keeps the interface
// honest (every method throws NotImplemented) so nothing can mistake it for settlement.
import { NotImplementedError } from "./errors.js";
import type { LockTerms, RailReceipt, SettlementRail } from "./types.js";

const UNIT = "u-rails-03";

export class FlopHtlcRail implements SettlementRail {
  readonly id = "flop-htlc";

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
