// Forward paging that never skips a seq. The venue serves the OLDEST `limit` messages after
// `since`, so the next cursor is the max seq of the page just read, never the room's
// last_seq (jumping to last_seq after a partial page skips everything between). Stop when a
// page is shorter than the limit: that page was the tail.
import type { ReadOptions, RoomView, VenueMessage } from "./types.js";

export interface RoomReader {
  read(room: string, opts?: ReadOptions): Promise<RoomView>;
}

export interface ForwardOptions {
  since: number;
  limit?: number;
  /** Safety valve for tests and runaway rooms. */
  maxPages?: number;
}

export function maxSeq(messages: readonly VenueMessage[], floor: number): number {
  return messages.reduce((m, x) => Math.max(m, x.seq), floor);
}

export async function* readForward(
  reader: RoomReader,
  room: string,
  opts: ForwardOptions,
): AsyncGenerator<VenueMessage, number, void> {
  const limit = opts.limit ?? 200;
  const maxPages = opts.maxPages ?? Number.POSITIVE_INFINITY;
  let cursor = opts.since;
  for (let page = 0; page < maxPages; page += 1) {
    const view = await reader.read(room, { since: cursor, limit });
    const fresh = view.messages.filter((m) => m.seq > cursor).sort((a, b) => a.seq - b.seq);
    for (const message of fresh) yield message;
    const next = maxSeq(fresh, cursor);
    const tail = view.messages.length < limit || next === cursor;
    cursor = next;
    if (tail) break;
  }
  return cursor;
}

/** Collect a forward walk into an array (small rooms, tests). */
export async function readAllForward(
  reader: RoomReader,
  room: string,
  opts: ForwardOptions,
): Promise<{ messages: VenueMessage[]; cursor: number }> {
  const messages: VenueMessage[] = [];
  const walk = readForward(reader, room, opts);
  for (;;) {
    const step = await walk.next();
    if (step.done) return { messages, cursor: step.value };
    messages.push(step.value);
  }
}
