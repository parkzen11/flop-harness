import { describe, expect, it } from "vitest";
import type { Transport } from "../../src/venue/types.js";
import { exported, loadUnit, unitPresent } from "./_unit.js";

const ID = "u-venue-04";
type ExportRoom = (
  t: Transport,
  base: string,
  room: string,
) => Promise<{
  text: string;
  generation: string | null;
  records: Array<{ seq: number; line: string }>;
}>;

const ROW1 = JSON.stringify({ seq: 1, ts: "2026-09-06T00:00:00Z", from: "~bob", text: "hi" });
const ROW2 = JSON.stringify({
  seq: 2,
  ts: "2026-09-06T00:00:01Z",
  from: "~amy",
  text: "yo",
  sig: null,
  nonce: null,
});
const JSONL = `${ROW1}\n${ROW2}\n`;

describe.skipIf(!unitPresent(ID))(ID, () => {
  it("fetches /r/<room>/export, keeps the bytes, reads the generation header, parses records", async () => {
    const mod = await loadUnit("src/venue/export.ts");
    const exportRoom = exported<ExportRoom>(mod, "exportRoom");
    const urls: string[] = [];
    const transport: Transport = async (req) => {
      urls.push(req.url);
      return { status: 200, body: JSONL, headers: { "x-room-generation": "12" } };
    };
    const out = await exportRoom(transport, "https://v", "lobby");
    expect(urls).toEqual(["https://v/r/lobby/export"]);
    expect(out.text).toBe(JSONL);
    expect(out.generation).toBe("12");
    expect(out.records.map((r) => [r.seq, r.line])).toEqual([
      [1, "hi"],
      [2, "yo"],
    ]);
  });

  it("throws a BadResponseError on a non-2xx", async () => {
    const mod = await loadUnit("src/venue/export.ts");
    const exportRoom = exported<ExportRoom>(mod, "exportRoom");
    const transport: Transport = async () => ({ status: 404, body: "no such room\n", headers: {} });
    await expect(exportRoom(transport, "https://v", "nope")).rejects.toThrow("404 no such room");
  });
});
