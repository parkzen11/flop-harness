import type { HttpRequest, HttpResponse, Transport } from "./types.js";
export interface RetryPolicy {
sleep: (ms: number) => Promise<void>;
readTries?: number;
writeTries?: number;
tries429?: number;
}
const DEFAULT_READ_TRIES = 8;
const DEFAULT_WRITE_TRIES = 4;
const DEFAULT_TRIES_429 = 4;
function isReadRequest(req: HttpRequest): boolean {
const url = req.url.toLowerCase();
return !url.includes("/say-signed/") && !url.includes("/set-signed/");
}
function isRetryableStatus(status: number): boolean {
return status === 502 || status === 503 || status === 504;
}
function isRoomCreationBudget429(res: HttpResponse): boolean {
return res.status === 429 && /room-creation budget/i.test(res.body);
}
function getRetryAfterMs(res: HttpResponse): number {
const header = res.headers["retry-after"];
if (header) {
const seconds = parseInt(header, 10);
if (!isNaN(seconds)) return seconds * 1000;
}
return 5000;
}
export function withRetry(transport: Transport, policy?: RetryPolicy): Transport {
const sleep = policy?.sleep ?? (async (ms: number) => new Promise((r) => setTimeout(r, ms)));
const readTries = policy?.readTries ?? DEFAULT_READ_TRIES;
const writeTries = policy?.writeTries ?? DEFAULT_WRITE_TRIES;
const tries429 = policy?.tries429 ?? DEFAULT_TRIES_429;
return async (req: HttpRequest): Promise<HttpResponse> => {
const isRead = isReadRequest(req);
const maxTries = isRead ? readTries : writeTries;
let attempt = 0;
while (true) {
let res: HttpResponse;
try {
res = await transport(req);
} catch (err) {
attempt++;
if (attempt >= maxTries) throw err;
const delayMs = isRead
? Math.min(400 * Math.pow(2, attempt - 1) + Math.random() * 400, 4000)
: 3000 * attempt;
await sleep(delayMs);
continue;
}
if (res.status === 429) {
if (isRoomCreationBudget429(res)) return res;
attempt++;
if (attempt >= tries429) return res;
const delayMs = getRetryAfterMs(res);
await sleep(delayMs);
continue;
}
if (isRetryableStatus(res.status)) {
attempt++;
if (attempt >= maxTries) return res;
const delayMs = isRead
? Math.min(400 * Math.pow(2, attempt - 1) + Math.random() * 400, 4000)
: 3000 * attempt;
await sleep(delayMs);
continue;
}
return res;
}
};
}
