// The only place the harness touches the network. Every call carries a timeout: a stalled
// edge connection once hung every payee loop on a whole node for 20 minutes.
import type { HttpRequest, HttpResponse, Transport } from "./types.js";

export interface FetchTransportOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export function fetchTransport(opts: FetchTransportOptions = {}): Transport {
  const fetchImpl = opts.fetchImpl ?? globalThis.fetch;
  const timeoutMs = opts.timeoutMs ?? 45_000;
  return async (request: HttpRequest): Promise<HttpResponse> => {
    const res = await fetchImpl(request.url, {
      method: request.method,
      headers: { accept: "application/json, text/plain", ...request.headers },
      signal: AbortSignal.timeout(timeoutMs),
    });
    const headers: Record<string, string> = {};
    res.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });
    return { status: res.status, body: await res.text(), headers };
  };
}
