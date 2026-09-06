// Prints the DID note the harness WOULD write for a key, and where. `--live` (the actual
// set-signed write) is unit u-cli-06; until then the flag is refused, never ignored.
import { flagString, type ParsedArgs } from "../args.js";
import { buildDidNote, didNoteAddress, type DidNoteFields } from "../../identity/note.js";
import type { CliIo } from "../io.js";
import { loadSigner } from "../keystore.js";

export const PUBLISH_USAGE =
  "usage: flop-harness publish <name> [--mailbox <room>] [--rails paper,x402] " +
  "[--portfolio <https url>] [--program flop-harness] [--tagline <text>] [--live]";

export function publishCommand(args: ParsedArgs, io: CliIo): number {
  const name = args.positional[1];
  if (name === undefined) {
    io.err(PUBLISH_USAGE);
    return 2;
  }
  const { signer } = loadSigner(io.home, name);
  const note = buildDidNote(noteFields(signer.did, args));
  const { ns, key } = didNoteAddress(signer.did);
  io.out(`/kv/${ns}/${key}`);
  io.out(note);
  if (args.flags["live"] === true) {
    io.err("publish --live is not implemented yet (unit u-cli-06); nothing was written");
    return 3;
  }
  return 0;
}

function noteFields(did: string, args: ParsedArgs): DidNoteFields {
  const fields: DidNoteFields = { did };
  const mailbox = flagString(args.flags, "mailbox");
  const rails = flagString(args.flags, "rails") ?? "paper";
  const portfolio = flagString(args.flags, "portfolio");
  const program = flagString(args.flags, "program") ?? "flop-harness";
  const tagline = flagString(args.flags, "tagline");
  if (mailbox !== undefined) fields.mailbox = mailbox;
  fields.rails = rails.split(",").filter((r) => r !== "");
  if (portfolio !== undefined) fields.portfolio = portfolio;
  fields.program = program;
  if (tagline !== undefined) fields.tagline = tagline;
  return fields;
}
