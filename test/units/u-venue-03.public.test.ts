import { describe, expect, it } from "vitest";
import { exported, loadUnit, unitPresent } from "./_unit.js";

const ID = "u-venue-03";
type Parse = (status: number, body: string, nowMs: number) => { spentUntilMs: number } | null;
type IsCap = (body: string) => boolean;
interface RoomBudget {
  note(r: { spentUntilMs: number }): void;
  canCreate(nowMs: number): boolean;
  created(nowMs: number): void;
  createdToday(nowMs: number): number;
}

describe.skipIf(!unitPresent(ID))(ID, () => {
  const now = Date.UTC(2026, 8, 6, 15, 0, 0);

  it("parses the venue's room-creation-budget 429 with and without a wait", async () => {
    const mod = await loadUnit("src/venue/room-budget.ts");
    const parse = exported<Parse>(mod, "parseRoomBudgetRefusal");
    expect(parse(429, "room-creation budget spent for this IP; waiting 1200s", now)).toEqual({
      spentUntilMs: now + 1_200_000,
    });
    expect(parse(429, "Room-Creation Budget exhausted", now)).toEqual({
      spentUntilMs: Date.UTC(2026, 8, 7),
    });
    expect(parse(429, "rate limited: 300 writes/min", now)).toBeNull();
    expect(parse(200, "room-creation budget", now)).toBeNull();
  });

  it("recognises both cap phrasings", async () => {
    const mod = await loadUnit("src/venue/room-budget.ts");
    const isCap = exported<IsCap>(mod, "isRoomCapError");
    expect(isCap("room limit reached")).toBe(true);
    expect(isCap("room-creation budget spent")).toBe(true);
    expect(isCap("nonce must increase")).toBe(false);
  });

  it("RoomBudget blocks creation until spentUntil and counts today's rooms with a UTC reset", async () => {
    const mod = await loadUnit("src/venue/room-budget.ts");
    const Budget = exported<new () => RoomBudget>(mod, "RoomBudget");
    const b = new Budget();
    expect(b.canCreate(now)).toBe(true);
    b.note({ spentUntilMs: now + 60_000 });
    expect(b.canCreate(now + 59_999)).toBe(false);
    expect(b.canCreate(now + 60_000)).toBe(true);
    b.created(now);
    b.created(now + 1);
    expect(b.createdToday(now + 2)).toBe(2);
    expect(b.createdToday(Date.UTC(2026, 8, 7, 0, 0, 1))).toBe(0);
  });
});
