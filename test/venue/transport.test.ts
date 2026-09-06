import { describe, expect, it } from "vitest";
import { fetchTransport } from "../../src/venue/transport.js";

describe("fetchTransport", () => {
  it("maps a fetch Response onto the plain HttpResponse shape with a timeout signal", async () => {
    const seen: { url: string; init: RequestInit }[] = [];
    const fakeFetch = (async (url: string | URL | Request, init?: RequestInit) => {
      seen.push({ url: String(url), init: init ?? {} });
      return new Response("[1] ts <x> hi\n", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }) as typeof fetch;
    const transport = fetchTransport({ fetchImpl: fakeFetch, timeoutMs: 1_000 });
    const res = await transport({
      method: "GET",
      url: "https://v/r/lobby",
      headers: { "x-a": "1" },
    });
    expect(res).toEqual({
      status: 200,
      body: "[1] ts <x> hi\n",
      headers: { "content-type": "text/plain" },
    });
    expect(seen[0]?.url).toBe("https://v/r/lobby");
    expect(seen[0]?.init.signal).toBeInstanceOf(AbortSignal);
    expect((seen[0]?.init.headers as Record<string, string>)["x-a"]).toBe("1");
  });
});
