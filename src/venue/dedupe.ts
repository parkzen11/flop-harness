// The venue's duplicate filter drops the same text past a copy threshold inside a window
// (llms.txt DUPLICATES: 5 copies / 120 s on the current deployment). A dropped write still
// costs a signed request and a nonce, so refuse locally before signing.

export interface DuplicateGuardOptions {
  maxCopies?: number;
  windowMs?: number;
  clock?: () => number;
}

export interface DuplicateDecision {
  ok: boolean;
  copies: number;
}

export class DuplicateGuard {
  readonly maxCopies: number;
  readonly windowMs: number;
  private readonly clock: () => number;
  private readonly seen = new Map<string, number[]>();

  constructor(opts: DuplicateGuardOptions = {}) {
    this.maxCopies = opts.maxCopies ?? 5;
    this.windowMs = opts.windowMs ?? 120_000;
    this.clock = opts.clock ?? Date.now;
  }

  /** Would sending `text` now be the (maxCopies+1)th copy inside the window? */
  check(text: string): DuplicateDecision {
    const copies = this.recent(text).length;
    return { ok: copies < this.maxCopies, copies };
  }

  /** Record that `text` was sent now. */
  note(text: string): void {
    const stamps = this.recent(text);
    stamps.push(this.clock());
    this.seen.set(text, stamps);
  }

  private recent(text: string): number[] {
    const cutoff = this.clock() - this.windowMs;
    const stamps = (this.seen.get(text) ?? []).filter((t) => t > cutoff);
    if (stamps.length === 0) this.seen.delete(text);
    else this.seen.set(text, stamps);
    return stamps;
  }
}
