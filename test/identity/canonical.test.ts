import { describe, expect, it } from "vitest";
import {
  assertName,
  canonicalMessage,
  canonicalNote,
  sweep,
} from "../../src/identity/canonical.js";
import vectors from "../fixtures/identity-vectors.json" with { type: "json" };

describe("sweep", () => {
  it("matches the donor fleet's sweep on the golden text", () => {
    expect(sweep(vectors.rfc8032.message.text)).toBe(vectors.rfc8032.message.swept);
  });

  it("replaces controls, format chars, surrogates and line separators with spaces, then trims", () => {
    expect(sweep("a b​c d\r\ne  ")).toBe("a b c d  e");
    expect(sweep(" x ")).toBe("x");
    expect(sweep("   ")).toBe("");
  });

  it("is idempotent", () => {
    const once = sweep("x\ty­");
    expect(sweep(once)).toBe(once);
  });
});

describe("canonical strings", () => {
  it("builds the message form `<room>|<nonce>|<text>`", () => {
    expect(canonicalMessage("tclk-offers", 7, "hello world")).toBe(
      vectors.rfc8032.message.canonical,
    );
  });

  it("builds the note form `<ns>|<key>|<nonce>|<value>`", () => {
    expect(canonicalNote("did-ab", "0123456789abcd", "3", "x")).toBe(
      vectors.rfc8032.note.canonical,
    );
  });

  it("enforces the venue name grammar", () => {
    expect(assertName("tclk-offers", "room")).toBe("tclk-offers");
    expect(() => assertName("Tclk", "room")).toThrow("bad room");
    expect(() => assertName("-x", "room")).toThrow();
    expect(() => assertName("a".repeat(49), "room")).toThrow();
  });
});
