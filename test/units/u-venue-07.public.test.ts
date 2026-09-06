import { describe, expect, it } from "vitest";
import type { Transport } from "../../src/venue/types.js";
import { parseFixture, replayTransport, type RecordedExchange } from "../fixtures/venue/replay.js";
import { exported, loadUnit, unitPresent } from "./_unit.js";

const ID = "u-venue-07";
type Recording = (inner: Transport, sink: (e: RecordedExchange) => void, base: string) => Transport;
type WriteFixture = (exchanges: RecordedExchange[]) => string;

describe.skipIf(!unitPresent(ID))(ID, () => {
  it("records exchanges in the replay shape, relative to base, without relay tokens", async () => {
    const mod = await loadUnit("src/venue/recording.ts");
    const recordingTransport = exported<Recording>(mod, "recordingTransport");
    const inner: Transport = async () => ({
      status: 200,
      body: '{"room":"lobby","count":0,"messages":[]}',
      headers: { "x-a": "1" },
    });
    const seen: RecordedExchange[] = [];
    const t = recordingTransport(inner, (e) => seen.push(e), "https://v");
    await t({
      method: "GET",
      url: "https://v/r/lobby?format=json",
      headers: { "x-relay-token": "secret" },
    });
    expect(seen).toEqual([
      {
        method: "GET",
        url: "/r/lobby?format=json",
        status: 200,
        body: '{"room":"lobby","count":0,"messages":[]}',
        headers: { "x-a": "1" },
      },
    ]);
    expect(JSON.stringify(seen)).not.toContain("secret");
  });

  it("round-trips through replayTransport", async () => {
    const mod = await loadUnit("src/venue/recording.ts");
    const recordingTransport = exported<Recording>(mod, "recordingTransport");
    const toJsonl = exported<WriteFixture>(mod, "fixtureLines");
    const inner: Transport = async () => ({ status: 404, body: "no such room\n", headers: {} });
    const seen: RecordedExchange[] = [];
    await recordingTransport(
      inner,
      (e) => seen.push(e),
      "https://v",
    )({ method: "GET", url: "https://v/r/x?format=json" });
    const replay = replayTransport(parseFixture(toJsonl(seen)), "https://v");
    expect(await replay({ method: "GET", url: "https://v/r/x?format=json" })).toEqual({
      status: 404,
      body: "no such room\n",
      headers: {},
    });
  });
});
