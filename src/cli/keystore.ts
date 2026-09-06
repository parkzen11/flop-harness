// Key files: <home>/keys/<name>.json, mode 0600, holding the seed. Loading a key returns a
// DetachedSigner, never the seed: the seed crosses the airlock exactly once, here.
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { NAME_RE } from "../identity/canonical.js";
import { isSeedHex, newSeed, seedToHex } from "../identity/keys.js";
import { DetachedSigner } from "../identity/signer.js";

export interface KeyInfo {
  name: string;
  did: string;
  created: string;
}

interface KeyFile extends KeyInfo {
  seed_hex: string;
}

export function keysDir(home: string): string {
  return path.join(home, "keys");
}

export function keyPath(home: string, name: string): string {
  if (!NAME_RE.test(name)) throw new Error(`keys: bad key name ${JSON.stringify(name)}`);
  return path.join(keysDir(home), `${name}.json`);
}

export function createKey(home: string, name: string, now: () => Date = () => new Date()): KeyInfo {
  const file = keyPath(home, name);
  if (existsSync(file)) throw new Error(`keys: ${name} already exists at ${file}`);
  mkdirSync(keysDir(home), { recursive: true, mode: 0o700 });
  const seed = newSeed();
  const did = DetachedSigner.fromSeed(seed).did;
  const record: KeyFile = { name, did, created: now().toISOString(), seed_hex: seedToHex(seed) };
  writeFileSync(file, `${JSON.stringify(record, null, 2)}\n`, { mode: 0o600 });
  chmodSync(file, 0o600);
  seed.fill(0);
  return { name, did, created: record.created };
}

export function loadSigner(home: string, name: string): { info: KeyInfo; signer: DetachedSigner } {
  const file = keyPath(home, name);
  if (!existsSync(file))
    throw new Error(`keys: no key named ${name} (run: flop-harness keys new ${name})`);
  const record = JSON.parse(readFileSync(file, "utf8")) as Partial<KeyFile>;
  if (!isSeedHex(record.seed_hex)) throw new Error(`keys: ${file} has no valid seed_hex`);
  const signer = DetachedSigner.fromSeedHex(record.seed_hex);
  const info: KeyInfo = { name, did: signer.did, created: record.created ?? "" };
  return { info, signer };
}

export function listKeys(home: string): KeyInfo[] {
  const dir = keysDir(home);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => {
      const record = JSON.parse(readFileSync(path.join(dir, f), "utf8")) as Partial<KeyFile>;
      return {
        name: record.name ?? f.slice(0, -5),
        did: record.did ?? "",
        created: record.created ?? "",
      };
    });
}
