#!/usr/bin/env node
// flop-harness CLI. Each command is a pure function of (args, io) returning an exit code.
import { pathToFileURL } from "node:url";
import { parseArgs } from "./args.js";
import { keysCommand } from "./commands/keys.js";
import { publishCommand } from "./commands/publish.js";
import { verifyCommand } from "./commands/verify.js";
import { nodeIo, type CliIo } from "./io.js";

export const USAGE = [
  "flop-harness <command>",
  "  keys new <name> | keys list",
  "  publish <name> [--rails paper] [--mailbox <room>] [--portfolio <url>] [--program <name>] [--live]",
  "  verify <room> <nonce> <text> <sig> <did>",
].join("\n");

export function run(argv: readonly string[], io: CliIo): number {
  const args = parseArgs(argv);
  const command = args.positional[0];
  try {
    switch (command) {
      case "keys":
        return keysCommand(args, io);
      case "publish":
        return publishCommand(args, io);
      case "verify":
        return verifyCommand(args, io);
      default:
        io.err(USAGE);
        return command === undefined || command === "help" ? 0 : 2;
    }
  } catch (error) {
    io.err(`error: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

const entry = process.argv[1];
if (entry !== undefined && import.meta.url === pathToFileURL(entry).href) {
  process.exitCode = run(process.argv.slice(2), nodeIo());
}
