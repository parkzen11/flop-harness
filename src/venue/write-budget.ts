// The venue allows a fixed number of writes per minute per IP (300 nominal). Every process
// on one IP shares that, so the tracker takes the per-process share as a constructor
// argument. It never sleeps: it says no and how long to wait, and the caller decides.

export interface WriteBudgetOptions {
  perMinute?: number;
  windowMs?: number;
  clock?: () => number;
}

export type BudgetDecision = { ok: true; remaining: number } | { ok: false; retryAfterMs: number };

export class WriteBudget {
  private readonly perMinute: number;
  private readonly windowMs: number;
  private readonly clock: () => number;
  private stamps: number[] = [];

  constructor(opts: WriteBudgetOptions = {}) {
    this.perMinute = opts.perMinute ?? 300;
    this.windowMs = opts.windowMs ?? 60_000;
    this.clock = opts.clock ?? Date.now;
    if (this.perMinute < 1) throw new Error("venue: write budget must allow at least one write");
  }

  /** Reserve one write now, or report how long until one frees up. */
  take(): BudgetDecision {
    const now = this.prune();
    if (this.stamps.length >= this.perMinute) {
      const oldest = this.stamps[0] ?? now;
      return { ok: false, retryAfterMs: Math.max(1, oldest + this.windowMs - now) };
    }
    this.stamps.push(now);
    return { ok: true, remaining: this.perMinute - this.stamps.length };
  }

  remaining(): number {
    this.prune();
    return this.perMinute - this.stamps.length;
  }

  private prune(): number {
    const now = this.clock();
    const cutoff = now - this.windowMs;
    this.stamps = this.stamps.filter((t) => t > cutoff);
    return now;
  }
}
