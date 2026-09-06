import { mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { flagString, parseArgs } from "../../src/cli/args.js";
import { memoryIo } from "../../src/cli/io.js";
import { createKey, keyPath, listKeys, loadSigner } from "../../src/cli/keystore.js";
import { run, USAGE } from "../../src/cli/main.js";
import { didNoteAddress } from "../../src/identity/note.js";
import vectors from "../fixtures/identity-vectors.json" with { type: "json" };

let home = "";
beforeEach(() => {
  home = mkdtempSync(path.join(tmpdir(), "flop-harness-"));
});
afterEach(() => {
  rmSync(home, { recursive: true, force: true });
});

describe("parseArgs", () => {
  it("separates positionals from --flags with and without values", () => {
    const args = parseArgs([
      "publish",
      "alice",
      "--rails",
      "paper,x402",
      "--live",
      "--tagline",
      "hi",
    ]);
    expect(args.positional).toEqual(["publish", "alice"]);
    expect(args.flags).toEqual({ rails: "paper,x402", live: true, tagline: "hi" });
    expect(flagString(args.flags, "live")).toBeUndefined();
    expect(flagString(args.flags, "rails")).toBe("paper,x402");
  });
});

describe("keys", () => {
  it("creates a 0600 key file, lists it, and loads a signer without exposing the seed", () => {
    const io = memoryIo(home);
    expect(run(["keys", "new", "alice"], io)).toBe(0);
    const [name, did] = (io.stdout[0] ?? "").split(" ");
    expect(name).toBe("alice");
    expect(did).toMatch(/^did:key:z6Mk/);
    const file = keyPath(home, "alice");
    expect(statSync(file).mode & 0o777).toBe(0o600);
    expect(JSON.parse(readFileSync(file, "utf8")).seed_hex).toMatch(/^[0-9a-f]{64}$/);
    const list = memoryIo(home);
    expect(run(["keys", "list"], list)).toBe(0);
    expect(list.stdout[0]).toContain(`alice\t${did}\t`);
    const { info, signer } = loadSigner(home, "alice");
    expect(info.did).toBe(did);
    expect(JSON.stringify(signer)).not.toContain("seed");
  });

  it("refuses duplicates, bad names and unknown subcommands", () => {
    createKey(home, "bob");
    expect(() => createKey(home, "bob")).toThrow("already exists");
    expect(() => createKey(home, "Bob")).toThrow("bad key name");
    const io = memoryIo(home);
    expect(run(["keys", "new"], io)).toBe(2);
    expect(run(["keys", "frobnicate"], io)).toBe(2);
    expect(run(["keys", "new", "bob"], io)).toBe(1);
    expect(io.stderr.at(-1)).toContain("already exists");
    expect(listKeys(path.join(home, "nowhere"))).toEqual([]);
    expect(() => loadSigner(home, "nobody")).toThrow("no key named nobody");
  });
});

describe("publish", () => {
  it("prints the note address and the DID note it would write", () => {
    const key = createKey(home, "alice");
    const io = memoryIo(home);
    const code = run(
      [
        "publish",
        "alice",
        "--mailbox",
        "mb-p-alice",
        "--rails",
        "x402,paper",
        "--portfolio",
        "https://x.test/i.json",
      ],
      io,
    );
    expect(code).toBe(0);
    const { ns, key: k } = didNoteAddress(key.did);
    expect(io.stdout).toEqual([
      `/kv/${ns}/${k}`,
      `${key.did} mailbox:mb-p-alice tclk1:paper,x402 portfolio:https://x.test/i.json program:flop-harness`,
    ]);
  });

  it("defaults to the paper rail and the flop-harness program", () => {
    const key = createKey(home, "alice");
    const io = memoryIo(home);
    expect(run(["publish", "alice"], io)).toBe(0);
    expect(io.stdout[1]).toBe(`${key.did} tclk1:paper program:flop-harness`);
  });

  it("refuses --live loudly instead of ignoring it", () => {
    createKey(home, "alice");
    const io = memoryIo(home);
    expect(run(["publish", "alice", "--live"], io)).toBe(3);
    expect(io.stderr[0]).toContain("u-cli-06");
    expect(run(["publish"], io)).toBe(2);
  });
});

describe("verify", () => {
  const v = vectors.rfc8032;
  it("verifies the golden vector and rejects a tampered text", () => {
    const io = memoryIo(home);
    expect(
      run(["verify", v.message.room, v.message.nonce, v.message.text, v.message.sig, v.did], io),
    ).toBe(0);
    expect(io.stdout[0]).toContain("ok");
    expect(
      run(["verify", v.message.room, v.message.nonce, "tampered", v.message.sig, v.did], io),
    ).toBe(1);
    expect(io.stdout[1]).toContain("FAIL");
    expect(
      run(["verify", v.message.room, v.message.nonce, "x", v.message.sig, "did:web:x"], io),
    ).toBe(1);
    expect(run(["verify", "room"], io)).toBe(2);
  });
});

describe("main", () => {
  it("prints usage for help and unknown commands", () => {
    const io = memoryIo(home);
    expect(run([], io)).toBe(0);
    expect(run(["help"], io)).toBe(0);
    expect(run(["bogus"], io)).toBe(2);
    expect(io.stderr[0]).toBe(USAGE);
  });
});
