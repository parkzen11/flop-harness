import { decodeFrame } from "@flop-labs/tclk";
import type { VenueMessage } from "../venue/types.js";
export interface Sweep {
frames: Record<string, number>;
malformed: Array<{ seq: number; reason: string }>;
unverified: number;
nonTclk: number;
}
export function decodeSweep(messages: VenueMessage[]): Sweep {
const frames: Record<string, number> = {};
const malformed: Array<{ seq: number; reason: string }> = [];
let unverified = 0;
let nonTclk = 0;
for (const msg of messages) {
const text = msg.text;
if (!text.startsWith("tclk1 ")) {
nonTclk++;
continue;
}
let frame;
try {
frame = decodeFrame(text);
} catch (err) {
const reason = err instanceof Error ? err.message : String(err);
malformed.push({ seq: msg.seq, reason });
continue;
}
if (!msg.sig || frame.from !== msg.from) {
unverified++;
continue;
}
const type = frame.type;
frames[type] = (frames[type] || 0) + 1;
}
return { frames, malformed, unverified, nonTclk };
}
