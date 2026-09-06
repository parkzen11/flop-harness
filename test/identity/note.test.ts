import { describe, expect, it } from "vitest";
import { buildDidNote, didNoteAddress, parseDidNote } from "../../src/identity/note.js";
import vectors from "../fixtures/identity-vectors.json" with { type: "json" };

const did = vectors.rfc8032.did;

describe("didNoteAddress", () => {
  it("matches the donor fleet's sha256 sharding", () => {
    expect(didNoteAddress(did)).toEqual(vectors.rfc8032.noteAddress);
    expect(didNoteAddress(vectors.ones.did)).toEqual(vectors.ones.noteAddress);
  });
});

describe("buildDidNote", () => {
  it("emits DID, mailbox, tclk1 rails, portfolio and program tokens in order", () => {
    const note = buildDidNote({
      did,
      mailbox: "mb-p-alice-oomsw",
      rails: ["x402", "paper", "PaperRail"],
      portfolio: "https://flop-market.pages.dev/archive/did/oMMsw/index.json",
      program: "flop-harness",
      tagline: "small\tmodels,​ big rooms",
    });
    expect(note).toBe(
      `${did} mailbox:mb-p-alice-oomsw tclk1:paper,x402 ` +
        "portfolio:https://flop-market.pages.dev/archive/did/oMMsw/index.json " +
        "program:flop-harness small models,  big rooms",
    );
    expect(note.length).toBeLessThan(4096);
  });

  it("omits absent tokens", () => {
    expect(buildDidNote({ did })).toBe(did);
    expect(buildDidNote({ did, rails: [] })).toBe(did);
  });

  it("rejects bad inputs loudly", () => {
    expect(() => buildDidNote({ did: "did:web:x" })).toThrow("did:key");
    expect(() => buildDidNote({ did, mailbox: "Mailbox" })).toThrow("bad mailbox");
    expect(() => buildDidNote({ did, portfolio: "http://x" })).toThrow("https");
    expect(() => buildDidNote({ did, rails: ["bogus-rail"] })).toThrow();
  });
});

describe("parseDidNote", () => {
  it("round-trips a built note", () => {
    const note = buildDidNote({
      did,
      mailbox: "mb-p-alice",
      rails: ["paper"],
      portfolio: "https://example.com/i.json",
      program: "flop-harness",
      tagline: "hi there",
    });
    expect(parseDidNote(note)).toEqual({
      did,
      mailbox: "mb-p-alice",
      rails: ["paper"],
      portfolio: "https://example.com/i.json",
      program: "flop-harness",
      tagline: "hi there",
    });
  });

  it("returns null without a leading DID and tolerates junk tokens", () => {
    expect(parseDidNote("hello world")).toBeNull();
    expect(parseDidNote(`${did} tclk1:not-a-rail mailbox: foo:bar`)).toEqual({
      did,
      tagline: "tclk1:not-a-rail mailbox: foo:bar",
    });
  });
});
