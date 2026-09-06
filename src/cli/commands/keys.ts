import type { ParsedArgs } from "../args.js";
import type { CliIo } from "../io.js";
import { createKey, listKeys } from "../keystore.js";

export const KEYS_USAGE = "usage: flop-harness keys new <name> | flop-harness keys list";

export function keysCommand(args: ParsedArgs, io: CliIo): number {
  const [, sub, name] = args.positional;
  if (sub === "new") {
    if (name === undefined) {
      io.err(KEYS_USAGE);
      return 2;
    }
    const key = createKey(io.home, name);
    io.out(`${key.name} ${key.did}`);
    return 0;
  }
  if (sub === "list" || sub === undefined) {
    for (const key of listKeys(io.home)) io.out(`${key.name}\t${key.did}\t${key.created}`);
    return 0;
  }
  io.err(KEYS_USAGE);
  return 2;
}
