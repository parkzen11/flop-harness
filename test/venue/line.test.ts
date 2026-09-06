import { describe, expect, it } from "vitest";
import {
  assertTextBudget,
  assertUrlBudget,
  encodeText,
  MAX_TEXT_CHARS,
  singleLine,
} from "../../src/venue/line.js";
import { parseBudgetFooter, parseWriteReply, stripBanner } from "../../src/venue/reply.js";
import { noteUrl, readUrl, saySignedUrl, setSignedUrl } from "../../src/venue/urls.js";

describe("singleLine", () => {
  it("folds CR/LF and line separators into spaces and sweeps", () => {
    expect(singleLine("a\r\nb\n\nc d e\t")).toBe("a b c d e");
  });
  it("is idempotent", () => {
    const once = singleLine("x\ny");
    expect(singleLine(once)).toBe(once);
  });
});

describe("budgets", () => {
  it("accepts exactly the cap and refuses one more", () => {
    expect(assertTextBudget("x".repeat(MAX_TEXT_CHARS))).toHaveLength(4096);
    expect(() => assertTextBudget("x".repeat(MAX_TEXT_CHARS + 1))).toThrow("at most 4096");
  });
  it("checks the encoded url ceiling", () => {
    expect(assertUrlBudget("https://x/y", 20)).toBe("https://x/y");
    expect(() => assertUrlBudget("https://x/" + "%20".repeat(10), 20)).toThrow("percent-encoding");
  });
  it("percent-encodes the way the venue decodes", () => {
    expect(encodeText("a b|c/d?e&f")).toBe("a%20b%7Cc%2Fd%3Fe%26f");
  });
});

describe("urls", () => {
  it("builds read urls with only the options given", () => {
    expect(readUrl("https://v/", "lobby")).toBe("https://v/r/lobby?format=json");
    expect(readUrl("https://v", "lobby", { since: 5, wait: 10, limit: 200 })).toBe(
      "https://v/r/lobby?format=json&since=5&wait=10&limit=200",
    );
    expect(readUrl("https://v", "lobby", { wait: 0 })).toBe("https://v/r/lobby?format=json");
  });
  it("builds signed write urls and validates names", () => {
    expect(saySignedUrl("https://v", "r1", "did:key:zX", "SIG", "1", "a b")).toBe(
      "https://v/r/r1/say-signed/did:key:zX/SIG/1/a%20b",
    );
    expect(setSignedUrl("https://v", "ns", "k", "did:key:zX", "SIG", "2", "v")).toBe(
      "https://v/kv/ns/k/set-signed/did:key:zX/SIG/2/v",
    );
    expect(noteUrl("https://v", "ns", "k")).toBe("https://v/kv/ns/k");
    expect(() => saySignedUrl("https://v", "R", "d", "s", "1", "t")).toThrow("bad room");
    expect(() => noteUrl("https://v", "ns", "K")).toThrow("bad key");
  });
});

describe("write reply parsing", () => {
  it("picks our last row and the budget footer", () => {
    const body =
      "[10] 2026-09-06T00:00:00Z <MMsw> x\n[11] 2026-09-06T00:00:01Z <~bob> y\n# budget: writes 1/300\n";
    expect(parseWriteReply(body, "MMsw>")).toEqual({
      seq: 10,
      ts: "2026-09-06T00:00:00Z",
      budget: "# budget: writes 1/300",
    });
    expect(parseWriteReply(body)).toMatchObject({ seq: 11 });
    expect(parseWriteReply("nothing here")).toEqual({});
    expect(parseBudgetFooter("x")).toBeUndefined();
  });
  it("strips banners", () => {
    expect(stripBanner("!! banner\n\nvalue line\n")).toBe("value line");
  });
});
