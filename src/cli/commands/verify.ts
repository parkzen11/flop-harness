// Verify a venue message signature offline: the same check the venue and a refold run.
import { canonicalMessage, sweep } from "../../identity/canonical.js";
import { isDidKey } from "../../identity/did.js";
import { verifyCanonical } from "../../identity/sign.js";
import type { ParsedArgs } from "../args.js";
import type { CliIo } from "../io.js";

export const VERIFY_USAGE = "usage: flop-harness verify <room> <nonce> <text> <sig> <did>";

export function verifyCommand(args: ParsedArgs, io: CliIo): number {
  const [, room, nonce, text, sig, did] = args.positional;
  if (
    room === undefined ||
    nonce === undefined ||
    text === undefined ||
    sig === undefined ||
    did === undefined
  ) {
    io.err(VERIFY_USAGE);
    return 2;
  }
  if (!isDidKey(did)) {
    io.err(`FAIL not an ed25519 did:key: ${did}`);
    return 1;
  }
  const canonical = canonicalMessage(room, nonce, sweep(text));
  if (verifyCanonical(did, canonical, sig)) {
    io.out(`ok ${did} signed ${JSON.stringify(canonical)}`);
    return 0;
  }
  io.out(`FAIL signature does not verify for ${JSON.stringify(canonical)}`);
  return 1;
}
