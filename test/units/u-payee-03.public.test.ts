import { describe, expect, it } from "vitest";
import { offer } from "./_frames.js";
import { exported, loadUnit, unitPresent } from "./_unit.js";

const ID = "u-payee-03";
type Notes = { get(ns: string, key: string): Promise<string | null> };
type ReadSpec = (o: ReturnType<typeof offer>, notes: Notes) => Promise<string | null>;

const notes: Notes = {
  async get(ns, key) {
    if (ns === "tclk-job-01" && key === "u-test-01") return "the full spec text";
    if (ns === "boom") throw new Error("kv down");
    return null;
  },
};

describe.skipIf(!unitPresent(ID))(ID, () => {
  it("resolves a /kv pointer, an inline context, and nothing", async () => {
    const readSpec = exported<ReadSpec>(await loadUnit("src/payee/spec.ts"), "readSpec");
    expect(
      await readSpec(
        offer({ job: { proto: "a2a", id: "t1", context: "/kv/tclk-job-01/u-test-01" } }),
        notes,
      ),
    ).toBe("the full spec text");
    expect(
      await readSpec(
        offer({ job: { proto: "a2a", id: "t2", context: "/kv/tclk-job-01/missing" } }),
        notes,
      ),
    ).toBeNull();
    expect(
      await readSpec(offer({ job: { proto: "a2a", id: "t3", context: "/kv/boom/x" } }), notes),
    ).toBeNull();
    expect(
      await readSpec(
        offer({ job: { proto: "a2a", id: "t4", context: "Count the rows in the table below" } }),
        notes,
      ),
    ).toBe("Count the rows in the table below");
    expect(
      await readSpec(offer({ job: { proto: "a2a", id: "t5", context: "short" } }), notes),
    ).toBeNull();
    expect(await readSpec(offer({ job: { proto: "a2a", id: "t6" } }), notes)).toBeNull();
    const { job: _job, ...rest } = offer();
    void _job;
    expect(await readSpec({ ...rest, id: rest.id } as ReturnType<typeof offer>, notes)).toBeNull();
  });
});
