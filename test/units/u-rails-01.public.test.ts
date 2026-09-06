import { describe, expect, it } from "vitest";
import type { SettlementRail } from "../../src/rails/types.js";
import { railContractSuite } from "../rails/contract.js";
import { exported, loadUnit, unitPresent } from "./_unit.js";

const ID = "u-rails-01";
type Ctor = new (clock?: () => number) => SettlementRail;

describe.skipIf(!unitPresent(ID))(ID, () => {
  it("is exported from the rails barrel with id memory", async () => {
    const barrel = await loadUnit("src/rails/index.ts");
    const Memory = exported<Ctor>(barrel, "MemoryRail");
    expect(new Memory().id).toBe("memory");
  });

  it("passes the rail contract", async () => {
    const Memory = exported<Ctor>(await loadUnit("src/rails/memory.ts"), "MemoryRail");
    railContractSuite("memory", (clock) => new Memory(() => clock.now));
  });
});
