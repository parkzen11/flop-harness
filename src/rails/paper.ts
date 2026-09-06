// The paper rail: tclk's PaperRail (records the lifecycle in a world-writable note and
// backs it with NOTHING) behind the harness interface. A `paper` deal is a rehearsal.
import {
  MemoryNoteStore,
  PaperRail as TclkPaperRail,
  type NoteStore,
  type PaperRecord,
} from "@flop-labs/tclk";
import type { LockTerms, RailReceipt, SettlementRail } from "./types.js";

export { MemoryNoteStore };
export type { NoteStore, PaperRecord };

export class PaperRail implements SettlementRail {
  readonly id = "paper";
  private readonly inner: TclkPaperRail;

  constructor(notes: NoteStore, clock: () => number = Date.now) {
    this.inner = new TclkPaperRail(notes, clock);
  }

  lock(terms: LockTerms): Promise<string> {
    return this.inner.lock(terms);
  }

  verifyLock(terms: LockTerms, ref: string): Promise<boolean> {
    return this.inner.verifyLock(terms, ref);
  }

  claim(ref: string, secret: string): Promise<void> {
    return this.inner.claim(ref, secret);
  }

  refund(ref: string): Promise<void> {
    return this.inner.refund(ref);
  }

  async receipt(ref: string): Promise<RailReceipt | null> {
    const record = await this.inner.read(ref);
    if (record === null) return null;
    const out: RailReceipt = { rail: this.id, ref, contract: ref, status: record.status };
    if (record.secret !== undefined) out.secret = record.secret;
    return out;
  }
}
