import { decodeFrame, type TclkFrame } from "@flop-labs/tclk";
import type { VenueMessage } from "../venue/types.js";
export interface BucketMetrics {
bucket: number;
offers: number;
accepts: number;
locks: number;
reveals: number;
refunds: number;
receipts: number;
heartbeats: number;
nonFrameLines: number;
distinctPayers: number;
distinctPayees: number;
lockRate: number;
}
export interface MetricsOptions {
bucketMs?: number;
}
export function boardMetrics(
messages: VenueMessage[],
options: MetricsOptions = {},
): BucketMetrics[] {
const bucketMs = options.bucketMs ?? 3600_000;
const buckets = new Map<number, BucketData>();
for (const msg of messages) {
if (!msg.sig) continue;
const ts = new Date(msg.ts).getTime();
const bucketKey = Math.floor(ts / bucketMs) * bucketMs;
let bucket = buckets.get(bucketKey);
if (!bucket) {
bucket = {
offers: 0,
accepts: 0,
locks: 0,
reveals: 0,
refunds: 0,
receipts: 0,
heartbeats: 0,
nonFrameLines: 0,
payers: new Set<string>(),
payees: new Set<string>(),
};
buckets.set(bucketKey, bucket);
}
let frame: TclkFrame | null = null;
try {
frame = decodeFrame(msg.text);
} catch {
bucket.nonFrameLines++;
continue;
}
switch (frame.type) {
case "offer":
bucket.offers++;
if (frame.role === "payer") {
bucket.payers.add(frame.from);
} else {
bucket.payees.add(frame.from);
}
break;
case "accept":
bucket.accepts++;
bucket.payees.add(frame.from);
break;
case "lock":
bucket.locks++;
bucket.payers.add(frame.from);
break;
case "reveal":
bucket.reveals++;
bucket.payees.add(frame.from);
break;
case "refund":
bucket.refunds++;
break;
case "receipt":
bucket.receipts++;
break;
case "heartbeat":
bucket.heartbeats++;
break;
}
}
const result: BucketMetrics[] = [];
const sortedKeys = Array.from(buckets.keys()).sort((a, b) => a - b);
for (const bucketKey of sortedKeys) {
const data = buckets.get(bucketKey)!;
const lockRate = data.accepts > 0 ? data.locks / data.accepts : 0;
result.push({
bucket: bucketKey,
offers: data.offers,
accepts: data.accepts,
locks: data.locks,
reveals: data.reveals,
refunds: data.refunds,
receipts: data.receipts,
heartbeats: data.heartbeats,
nonFrameLines: data.nonFrameLines,
distinctPayers: data.payers.size,
distinctPayees: data.payees.size,
lockRate,
});
}
return result;
}
interface BucketData {
offers: number;
accepts: number;
locks: number;
reveals: number;
refunds: number;
receipts: number;
heartbeats: number;
nonFrameLines: number;
payers: Set<string>;
payees: Set<string>;
}
