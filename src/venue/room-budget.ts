/**
* Room-creation budget detector for the venue's 429 responses.
*/
/**
* Parse a 429 response that indicates room-creation budget exhaustion.
* Returns { spentUntilMs } if the body matches /room-creation budget/i,
* extracting "waiting <n>s" when present, otherwise returning next UTC midnight.
* Returns null for unrelated 429s or non-429 status codes.
*/
export function parseRoomBudgetRefusal(
status: number,
body: string,
nowMs: number,
): { spentUntilMs: number } | null {
if (status !== 429) return null;
if (!/room-creation budget/i.test(body)) return null;
const waitMatch = /waiting (\d+)s/i.exec(body);
if (waitMatch && waitMatch[1]) {
const waitSeconds = parseInt(waitMatch[1], 10);
return { spentUntilMs: nowMs + waitSeconds * 1000 };
}
// No wait time specified; return next UTC midnight
const nowDate = new Date(nowMs);
const nextMidnight = Date.UTC(
nowDate.getUTCFullYear(),
nowDate.getUTCMonth(),
nowDate.getUTCDate() + 1,
);
return { spentUntilMs: nextMidnight };
}
/**
* Check if a response body indicates a room capacity error.
* Matches /room limit reached|room-creation budget/i.
*/
export function isRoomCapError(body: string): boolean {
return /room limit reached|room-creation budget/i.test(body);
}
/**
* Tracks room-creation budget and counts rooms created today with UTC midnight reset.
*/
export class RoomBudget {
private spentUntilMs = 0;
private createdRooms: number[] = [];
/**
* Record a budget refusal with its spentUntilMs timestamp.
*/
note(refusal: { spentUntilMs: number }): void {
this.spentUntilMs = Math.max(this.spentUntilMs, refusal.spentUntilMs);
}
/**
* Check if room creation is allowed at the given time.
*/
canCreate(nowMs: number): boolean {
return nowMs >= this.spentUntilMs;
}
/**
* Record that a room was created at the given time.
*/
created(nowMs: number): void {
this.createdRooms.push(nowMs);
}
/**
* Count rooms created today (same UTC day as nowMs).
*/
createdToday(nowMs: number): number {
const nowDate = new Date(nowMs);
const todayStart = Date.UTC(
nowDate.getUTCFullYear(),
nowDate.getUTCMonth(),
nowDate.getUTCDate(),
);
const todayEnd = Date.UTC(
nowDate.getUTCFullYear(),
nowDate.getUTCMonth(),
nowDate.getUTCDate() + 1,
);
return this.createdRooms.filter((ts) => ts >= todayStart && ts < todayEnd).length;
}
}
