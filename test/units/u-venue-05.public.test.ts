import type { NoteStore } from "@flop-labs/tclk";
import { describe, expect, it } from "vitest";
import { PaperRail } from "../../src/rails/paper.js";
import type { HttpResponse } from "../../src/venue/types.js";
import { railContractSuite } from "../rails/contract.js";
import { exported, loadUnit, unitPresent } from "./_unit.js";

const ID = "u-venue-05";
type Req = { method: string; url: string; body?: string };
type AnyTransport = (req: Req) => Promise<HttpResponse>;
type VenueNoteStore = (t: AnyTransport, base: string) => NoteStore;

/** A tiny in-memory kv server with the venue's if_absent / if semantics, 404 and 409. */
function fakeKv(): AnyTransport & { calls: Req[] } {
  const values = new Map<string, string>();
  const calls: Req[] = [];
  const t = async (req: Req): Promise<HttpResponse> => {
    calls.push(req);
    const u = new URL(req.url);
    const key = u.pathname.replace(/^\/kv\//, "");
    if (req.method === "GET") {
      const v = values.get(key);
      return v === undefined
        ? { status: 404, body: "not found\n", headers: {} }
        : { status: 200, body: `!! banner\n${v}\n`, headers: {} };
    }
    const current = values.get(key);
    if (u.searchParams.get("if_absent") === "1" && current !== undefined)
      return { status: 409, body: current, headers: {} };
    const expected = u.searchParams.get("if");
    if (expected !== null && current !== expected)
      return { status: 409, body: current ?? "", headers: {} };
    values.set(key, (JSON.parse(req.body ?? "{}") as { value: string }).value);
    return { status: 200, body: "ok\n", headers: {} };
  };
  return Object.assign(t, { calls });
}

describe.skipIf(!unitPresent(ID))(ID, () => {
  it("get → value|null and set → won with the venue's CAS lane", async () => {
    const mod = await loadUnit("src/venue/note-store.ts");
    const venueNoteStore = exported<VenueNoteStore>(mod, "venueNoteStore");
    const kv = fakeKv();
    const notes = venueNoteStore(kv, "https://v");
    expect(await notes.get("ns", "k")).toBeNull();
    expect(await notes.set("ns", "k", "one", { ifAbsent: true })).toBe(true);
    expect(await notes.set("ns", "k", "two", { ifAbsent: true })).toBe(false);
    expect(await notes.set("ns", "k", "two", { if: "one" })).toBe(true);
    expect(await notes.set("ns", "k", "three", { if: "one" })).toBe(false);
    expect(await notes.get("ns", "k")).toBe("two");
    expect(kv.calls.find((c) => c.method === "POST")?.url).toContain("/kv/ns/k?if_absent=1");
  });

  it("carries PaperRail through the rail contract", async () => {
    const mod = await loadUnit("src/venue/note-store.ts");
    const venueNoteStore = exported<VenueNoteStore>(mod, "venueNoteStore");
    railContractSuite(
      "paper over venueNoteStore",
      (clock) => new PaperRail(venueNoteStore(fakeKv(), "https://v"), () => clock.now),
    );
  });
});
