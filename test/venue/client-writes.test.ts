import { describe, expect, it } from "vitest";
import { DetachedSigner } from "../../src/identity/signer.js";
import { VenueClient } from "../../src/venue/client.js";
import { DuplicateGuard } from "../../src/venue/dedupe.js";
import { WriteBudget } from "../../src/venue/write-budget.js";
import vectors from "../fixtures/identity-vectors.json" with { type: "json" };
import { fixtureTransport, REPLAY_BASE } from "../fixtures/venue/replay.js";

const FIXTURE = new URL("../fixtures/venue/signed-writes.jsonl", import.meta.url).pathname;
const signer = DetachedSigner.fromSeedHex(vectors.rfc8032.seed);

function client(extra: Partial<ConstructorParameters<typeof VenueClient>[0]> = {}) {
  const transport = fixtureTransport(FIXTURE);
  return { transport, venue: new VenueClient({ base: REPLAY_BASE, transport, signer, ...extra }) };
}

describe("VenueClient.say (signed GET)", () => {
  it("signs the swept single line and hits /r/<room>/say-signed/<did>/<sig>/<nonce>/<text>", async () => {
    const { transport, venue } = client();
    const r = await venue.say("tclk-offers", 7, "hello\nworld\t");
    expect(r.ok).toBe(true);
    expect(r.status).toBe(200);
    expect(r.text).toBe("hello world");
    expect(r.sig).toBe(vectors.rfc8032.message.sig);
    expect(r.nonce).toBe("7");
    expect(r.seq).toBe(4242);
    expect(r.ts).toBe("2026-09-06T00:00:02Z");
    expect(r.budget).toBe("# budget: writes 12/300 per minute, reads 40/600");
    const url = transport.calls[0]?.url ?? "";
    expect(url).toBe(
      `${REPLAY_BASE}/r/tclk-offers/say-signed/${signer.did}/${vectors.rfc8032.message.sig}/7/hello%20world`,
    );
  });

  it("reports a 409 (nonce) and a 429 (rate limit) as not ok, with the venue's words", async () => {
    const { venue } = client();
    const conflict = await venue.say("tclk-offers", 8, "hello world");
    expect(conflict.ok).toBe(false);
    expect(conflict.status).toBe(409);
    expect(conflict.body).toContain("nonce must increase");
    const limited = await venue.say("tclk-offers", 9, "hello world");
    expect(limited.status).toBe(429);
    expect(limited.seq).toBeUndefined();
  });

  it("refuses to sign a text over the venue cap", async () => {
    const { transport, venue } = client();
    await expect(venue.say("tclk-offers", 7, "x".repeat(4097))).rejects.toThrow("4097 chars");
    expect(transport.calls).toHaveLength(0);
  });

  it("refuses to write without a signer", async () => {
    const transport = fixtureTransport(FIXTURE);
    const anon = new VenueClient({ base: REPLAY_BASE, transport });
    expect(anon.did).toBeUndefined();
    await expect(anon.say("tclk-offers", 1, "x")).rejects.toThrow("no signer");
  });

  it("stops at the local write budget before the venue sees the request", async () => {
    let now = 0;
    const budget = new WriteBudget({ perMinute: 1, clock: () => now });
    const { transport, venue } = client({
      writeBudget: budget,
      duplicateGuard: new DuplicateGuard({ maxCopies: 9 }),
    });
    await venue.say("tclk-offers", 7, "hello world");
    await expect(venue.say("tclk-offers", 7, "hello world")).rejects.toThrow("write budget spent");
    expect(transport.calls).toHaveLength(1);
    now = 61_000;
    await expect(venue.say("tclk-offers", 7, "hello world")).resolves.toMatchObject({ ok: true });
  });

  it("refuses the sixth copy of the same text inside 120 s", async () => {
    let now = 0;
    const guard = new DuplicateGuard({ clock: () => now });
    const { transport, venue } = client({ duplicateGuard: guard });
    for (let i = 0; i < 5; i += 1) await venue.say("tclk-offers", 7, "hello world");
    await expect(venue.say("tclk-offers", 7, "hello world")).rejects.toThrow("dupe filter");
    expect(transport.calls).toHaveLength(5);
    now = 120_001;
    await expect(venue.say("tclk-offers", 7, "hello world")).resolves.toMatchObject({ ok: true });
  });
});

describe("VenueClient notes", () => {
  it("writes a note through set-signed and reads it back without the banner", async () => {
    const { venue } = client();
    const value = `${signer.did} mailbox:mb-p-test program:flop-harness`;
    const w = await venue.setNote("did-06", "58808e85cc8317", 3, value);
    expect(w.ok).toBe(true);
    expect(w.budget).toContain("writes 13/300");
    expect(await venue.getNote("did-06", "58808e85cc8317")).toBe(value);
  });

  it("returns null for 404 and banner-only bodies, throws on 5xx", async () => {
    const { venue } = client();
    expect(await venue.getNote("did-00", "00000000000000")).toBeNull();
    expect(await venue.getNote("did-00", "empty000000000")).toBeNull();
    await expect(venue.getNote("did-00", "boom0000000000")).rejects.toThrow("503 upstream error");
  });
});
