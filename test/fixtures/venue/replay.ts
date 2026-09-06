// Recorded-venue replay. A fixture is JSONL, one exchange per line:
//   {"method":"GET","url":"/r/tclk-offers?format=json&since=100&limit=2","status":200,"body":"...","headers":{...}}
// `url` is relative to the base the client was built with. Exchanges with the same
// method+url are served in file order; the last one repeats, so an idempotent read can be
// polled. An unrecorded url throws with the list of what was recorded, which is the test
// failing loudly rather than touching the network.
import { readFileSync } from "node:fs";
import type { HttpRequest, HttpResponse, Transport } from "../../../src/venue/types.js";

export interface RecordedExchange {
  method: "GET";
  url: string;
  status: number;
  body: string;
  headers?: Record<string, string>;
}

export const REPLAY_BASE = "https://venue.test";

export function parseFixture(jsonl: string): RecordedExchange[] {
  return jsonl
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => JSON.parse(line) as RecordedExchange);
}

export function loadFixture(path: string): RecordedExchange[] {
  return parseFixture(readFileSync(path, "utf8"));
}

export interface ReplayTransport extends Transport {
  /** Every request the client made, in order. */
  calls: HttpRequest[];
}

function keyOf(method: string, url: string): string {
  return `${method} ${url}`;
}

export function replayTransport(exchanges: RecordedExchange[], base = REPLAY_BASE): ReplayTransport {
  const queues = new Map<string, RecordedExchange[]>();
  for (const ex of exchanges) {
    const key = keyOf(ex.method, base + ex.url);
    queues.set(key, [...(queues.get(key) ?? []), ex]);
  }
  const calls: HttpRequest[] = [];
  const transport = async (request: HttpRequest): Promise<HttpResponse> => {
    calls.push(request);
    const queue = queues.get(keyOf(request.method, request.url));
    if (queue === undefined || queue.length === 0) {
      const known = [...queues.keys()].join("\n  ");
      throw new Error(`replay: no recording for ${request.method} ${request.url}\nrecorded:\n  ${known}`);
    }
    const ex = queue.length > 1 ? (queue.shift() as RecordedExchange) : (queue[0] as RecordedExchange);
    return { status: ex.status, body: ex.body, headers: ex.headers ?? {} };
  };
  return Object.assign(transport, { calls });
}

export function fixtureTransport(path: string, base = REPLAY_BASE): ReplayTransport {
  return replayTransport(loadFixture(path), base);
}
