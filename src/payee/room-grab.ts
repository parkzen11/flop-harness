// Room grab by heartbeat with board fallback.
import {
encodeFrame,
makeHeartbeat,
type TclkFrame,
} from "@flop-labs/tclk";
export const OFFER_ROOM = "tclk-offers";
export interface RoomBudget {
maxAttempts: number;
minSleepMs: number;
maxSleepMs: number;
}
export interface GrabRoomOptions {
room: string;
contract: string;
signer: string;
post: (room: string, text: string) => Promise<{ ok: boolean; reason?: string }>;
budget: RoomBudget;
sleep: (ms: number) => Promise<void>;
maxAttempts?: number;
untilMs: number;
stop: () => boolean;
}
export interface PostDealOptions {
room: string;
frame: TclkFrame;
signer: string;
post: (room: string, text: string) => Promise<{ ok: boolean; reason?: string }>;
}
export type PostSurface = "deal" | "board";
/**
* Tries to create the derived deal room by posting a heartbeat frame there,
* retrying on room-cap errors with jittered sleeps while the budget allows.
* Returns true when the room exists (either created or already present).
*/
export async function grabRoom(opts: GrabRoomOptions): Promise<boolean> {
const {
room,
contract,
signer,
post,
budget,
sleep,
maxAttempts = budget.maxAttempts,
untilMs,
stop,
} = opts;
let attempts = 0;
while (attempts < maxAttempts && Date.now() < untilMs && !stop()) {
attempts++;
const heartbeat = makeHeartbeat({
from: signer,
contract,
nonce: `hb-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
});
const text = encodeFrame(heartbeat);
const result = await post(room, text);
if (result.ok) {
return true;
}
// Check if the failure is due to room cap
const isCapError =
result.reason?.includes("cap") ||
result.reason?.includes("full") ||
result.reason?.includes("limit");
if (!isCapError) {
// Non-cap error means room might exist or other issue
return true;
}
// Room cap hit, sleep with jitter before retry
if (attempts < maxAttempts && Date.now() < untilMs && !stop()) {
const jitter = Math.random();
const sleepMs =
budget.minSleepMs + jitter * (budget.maxSleepMs - budget.minSleepMs);
await sleep(sleepMs);
}
}
// Budget exhausted or time/stop condition met
return false;
}
/**
* Posts a frame to the deal room, falling back to the board (OFFER_ROOM)
* if the deal room has a cap error. Returns which surface accepted it.
*/
export async function postDeal(
opts: PostDealOptions,
): Promise<PostSurface | null> {
const { room, frame, post } = opts;
const text = encodeFrame(frame);
// Try deal room first
const dealResult = await post(room, text);
if (dealResult.ok) {
return "deal";
}
// Check if failure is due to cap
const isCapError =
dealResult.reason?.includes("cap") ||
dealResult.reason?.includes("full") ||
dealResult.reason?.includes("limit");
if (isCapError) {
// Fall back to board
const boardResult = await post(OFFER_ROOM, text);
if (boardResult.ok) {
return "board";
}
}
return null;
}
