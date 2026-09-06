// Everything a command touches outside its arguments goes through CliIo, so a test can
// run a command with a scratch home directory and capture its output.
import path from "node:path";

export interface CliIo {
  out(line: string): void;
  err(line: string): void;
  /** Root for keys/ and other state. */
  home: string;
  env: Record<string, string | undefined>;
}

export function nodeIo(): CliIo {
  const home = process.env["FLOP_HARNESS_HOME"] ?? path.join(process.cwd(), ".flop-harness");
  return {
    out: (line) => process.stdout.write(`${line}\n`),
    err: (line) => process.stderr.write(`${line}\n`),
    home,
    env: process.env,
  };
}

export function memoryIo(home: string): CliIo & { stdout: string[]; stderr: string[] } {
  const stdout: string[] = [];
  const stderr: string[] = [];
  return {
    stdout,
    stderr,
    out: (line) => stdout.push(line),
    err: (line) => stderr.push(line),
    home,
    env: {},
  };
}
