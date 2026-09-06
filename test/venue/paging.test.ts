import { describe, expect, it } from "vitest";
import { VenueClient } from "../../src/venue/client.js";
import { maxSeq, readAllForward } from "../../src/venue/paging.js";
import { fixtureTransport, REPLAY_BASE } from "../fixtures/venue/replay.js";

const FIXTURE = new URL("../fixtures/venue/board-paging.jsonl", import.meta.url).pathname;

function client() {
  const transport = fixtureTransport(FIXTURE);
  return { transport, venue: new VenueClient({ base: REPLAY_BASE, transport }) };
}

describe("forward paging", () => {
  it("walks since=lastSeq page by page and never skips a seq", async () => {
    const { transport, venue } = client();
    const { messages, cursor } = await readAllForward(venue, "tclk-offers", {
      since: 100,
      limit: 2,
    });
    expect(messages.map((m) => m.seq)).toEqual([101, 102, 103, 104, 105]);
    expect(cursor).toBe(105);
    expect(transport.calls.map((c) => c.url.replace(REPLAY_BASE, ""))).toEqual([
      "/r/tclk-offers?format=json&since=100&limit=2",
      "/r/tclk-offers?format=json&since=102&limit=2",
      "/r/tclk-offers?format=json&since=104&limit=2",
    ]);
  });

  it("stops on an empty page and keeps the cursor", async () => {
    const { venue } = client();
    const out = await readAllForward(venue, "quiet", { since: 9, limit: 2 });
    expect(out).toEqual({ messages: [], cursor: 9 });
  });

  it("is exposed on the client as readForward / readAll", async () => {
    const { venue } = client();
    const seqs: number[] = [];
    for await (const m of venue.readForward("tclk-offers", { since: 100, limit: 2 }))
      seqs.push(m.seq);
    expect(seqs).toEqual([101, 102, 103, 104, 105]);
    const all = await venue.readAll("tclk-offers", { since: 100, limit: 2, maxPages: 1 });
    expect(all.messages.map((m) => m.seq)).toEqual([101, 102]);
  });

  it("maxSeq keeps the floor when a page is empty", () => {
    expect(maxSeq([], 7)).toBe(7);
  });
});

describe("VenueClient.read", () => {
  it("returns the newest window without since, and passes wait/limit through", async () => {
    const { transport, venue } = client();
    const newest = await venue.read("tclk-offers", { limit: 2 });
    expect(newest.messages.map((m) => m.seq)).toEqual([104, 105]);
    const held = await venue.read("tclk-offers", { since: 105, wait: 10, limit: 200 });
    expect(held.wait_held).toBe(true);
    expect(held.messages).toEqual([]);
    expect(transport.calls.at(-1)?.url).toContain("since=105&wait=10&limit=200");
  });

  it("throws on a non-2xx status and on a malformed body", async () => {
    const { venue } = client();
    await expect(venue.read("missing")).rejects.toThrow("404 no such room");
    await expect(venue.read("broken")).rejects.toThrow();
    await expect(venue.read("Bad Room")).rejects.toThrow("bad room");
  });
});
