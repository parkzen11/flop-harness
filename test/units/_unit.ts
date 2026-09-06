// Helpers for public unit tests. A unit's test skips itself while the unit's first file is
// absent and runs for real once a patch adds it; nothing in test/ needs editing to activate.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");

export interface UnitSpec {
  id: string;
  files: string[];
  public_test: string;
  max_lines: number;
}

export function readUnit(id: string): UnitSpec {
  return JSON.parse(readFileSync(path.join(ROOT, "units", `${id}.json`), "utf8")) as UnitSpec;
}

export type UnitModule = Record<string, unknown>;

/** True when the unit's first listed file exists (the contributor's patch landed). */
export function unitPresent(id: string): boolean {
  const first = readUnit(id).files[0];
  return first !== undefined && existsSync(path.join(ROOT, first));
}

export function loadUnit(relPath: string): Promise<UnitModule> {
  const url = pathToFileURL(path.join(ROOT, relPath)).href;
  return import(/* @vite-ignore */ url) as Promise<UnitModule>;
}

/** Pull a typed export out of a loaded unit module; a missing export is a loud failure. */
export function exported<T>(mod: UnitModule, name: string): T {
  const value = mod[name];
  if (value === undefined) throw new Error(`unit module has no export named ${name}`);
  return value as T;
}
