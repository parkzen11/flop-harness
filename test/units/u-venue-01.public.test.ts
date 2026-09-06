import { describe, expect, it } from "vitest";
import type { HttpRequest, HttpResponse, Transport } from "../../src/venue/types.js";
import { exported, loadUnit, unitPresent } from "./_unit.js";

const ID = "u-venue-01";
type Policy = {
  sleep: (ms: number) => Promise<void>;
  readTries?: number;
  writeTries?: number;
  tries429?: number;
};
type WithRetry = (t: Transport, p: Policy) => Transport;

function scripted(responses: Array<HttpResponse | Error>): Transport & { calls: HttpRequest[] } {
  const calls: HttpRequest[] = [];
  const t = async (req: HttpRequest): Promise<HttpResponse> => {
    calls.push(req);
    const next = responses.shift();
    if (next === undefined) throw new Error("script exhausted");
    if (next instanceof Error) throw next;
    return next;
  };
  return Object.assign(t, { calls });
}
const ok: HttpResponse = { status: 200, body: "{}", headers: {} };
const r503: HttpResponse = { status: 503, body: "busy", headers: {} };
const read: HttpRequest = { method: "GET", url: "https://v/r/lobby?format=json" };
const write: HttpRequest = { method: "GET", url: "https://v/r/lobby/say-signed/d/s/1/x" };

describe.skipIf(!unitPresent(ID))(ID, () => {
  it("retries read 5xx with capped exponential jitter and returns the final 200", async () => {
    const mod = await loadUnit("src/venue/retry.ts");
    const withRetry = exported<WithRetry>(mod, "withRetry");
    const sleeps: number[] = [];
    const inner = scripted([r503, r503, ok]);
    const res = await withRetry(inner, { sleep: async (ms) => void sleeps.push(ms) })(read);
    expect(res.status).toBe(200);
    expect(inner.calls).toHaveLength(3);
    expect(sleeps).toHaveLength(2);
    for (const ms of sleeps) expect(ms).toBeLessThanOrEqual(4_400);
  });

  it("gives up on reads after readTries and rethrows network errors past the budget", async () => {
    const mod = await loadUnit("src/venue/retry.ts");
    const withRetry = exported<WithRetry>(mod, "withRetry");
    const inner = scripted([r503, r503, r503]);
    const res = await withRetry(inner, { sleep: async () => undefined, readTries: 2 })(read);
    expect(res.status).toBe(503);
    const dead = scripted([new Error("ECONNRESET"), new Error("ECONNRESET")]);
    await expect(
      withRetry(dead, { sleep: async () => undefined, readTries: 1 })(read),
    ).rejects.toThrow("ECONNRESET");
  });

  it("waits Retry-After on 429 and returns a room-creation-budget 429 immediately", async () => {
    const mod = await loadUnit("src/venue/retry.ts");
    const withRetry = exported<WithRetry>(mod, "withRetry");
    const sleeps: number[] = [];
    const limited = { status: 429, body: "rate limited", headers: { "retry-after": "7" } };
    const res = await withRetry(scripted([limited, ok]), {
      sleep: async (ms) => void sleeps.push(ms),
    })(write);
    expect(res.status).toBe(200);
    expect(sleeps).toEqual([7_000]);
    const budget = {
      status: 429,
      body: "room-creation budget spent; waiting 1200s",
      headers: { "retry-after": "1200" },
    };
    const inner = scripted([budget, ok]);
    const out = await withRetry(inner, { sleep: async () => undefined })(write);
    expect(out.status).toBe(429);
    expect(inner.calls).toHaveLength(1);
  });

  it("never retries 2xx, 409 or non-429 4xx", async () => {
    const mod = await loadUnit("src/venue/retry.ts");
    const withRetry = exported<WithRetry>(mod, "withRetry");
    for (const status of [200, 409, 404, 400]) {
      const inner = scripted([{ status, body: "", headers: {} }, ok]);
      const res = await withRetry(inner, { sleep: async () => undefined })(write);
      expect(res.status).toBe(status);
      expect(inner.calls).toHaveLength(1);
    }
  });
});
