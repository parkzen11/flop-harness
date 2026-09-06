// The DID note (technocore auth.md, pattern 3): one world-writable kv line that says
// where to reach an identity and what it can do. Tokens are space-separated
// `<name>:<value>` pairs after the DID itself. Anyone can overwrite it, so it is a
// routing hint; the proof is always a signature that verifies against the DID.
import { sha256 } from "@noble/hashes/sha2.js";
import { normalizeRailIds } from "@flop-labs/tclk";
import { assertName, sweep } from "./canonical.js";
import { isDidKey } from "./did.js";

export interface DidNoteFields {
  did: string;
  /** Mailbox room name (`mb-…`) the identity reads. */
  mailbox?: string;
  /** Settlement rails accepted, emitted as `tclk1:<a,b>`. */
  rails?: readonly string[];
  /** Public URL of the identity's tclk-portfolio index. */
  portfolio?: string;
  /** Program membership, e.g. `program:flop-harness`. */
  program?: string;
  /** Free text appended last; swept to one line. */
  tagline?: string;
}

export interface DidNoteTokens {
  did: string;
  mailbox?: string;
  rails?: string[];
  portfolio?: string;
  program?: string;
  tagline?: string;
}

const KNOWN = ["mailbox", "tclk1", "portfolio", "program"] as const;

function hex(bytes: Uint8Array): string {
  let out = "";
  for (const b of bytes) out += b.toString(16).padStart(2, "0");
  return out;
}

/** Key-publication address (auth.md): sha256(did) hex → ns `did-<2>`, key `<14>`. */
export function didNoteAddress(did: string): { ns: string; key: string } {
  const h = hex(sha256(new TextEncoder().encode(did)));
  return { ns: `did-${h.slice(0, 2)}`, key: h.slice(2, 16) };
}

export function buildDidNote(fields: DidNoteFields): string {
  if (!isDidKey(fields.did)) throw new Error("identity: DID note needs a did:key");
  const parts: string[] = [fields.did];
  if (fields.mailbox !== undefined) parts.push(`mailbox:${assertName(fields.mailbox, "mailbox")}`);
  if (fields.rails !== undefined && fields.rails.length > 0) {
    parts.push(`tclk1:${normalizeRailIds(fields.rails).join(",")}`);
  }
  if (fields.portfolio !== undefined) parts.push(`portfolio:${assertUrl(fields.portfolio)}`);
  if (fields.program !== undefined) parts.push(`program:${assertName(fields.program, "program")}`);
  if (fields.tagline !== undefined && sweep(fields.tagline) !== "")
    parts.push(sweep(fields.tagline));
  return parts.join(" ");
}

function assertUrl(value: string): string {
  if (!/^https:\/\/[^\s]+$/.test(value))
    throw new Error("identity: portfolio must be an https URL");
  return value;
}

/** Parse a note value. Null when the first token is not a DID. Unknown tokens join the tagline. */
export function parseDidNote(value: string): DidNoteTokens | null {
  const words = sweep(value)
    .split(/\s+/)
    .filter((w) => w !== "");
  const did = words[0];
  if (!isDidKey(did)) return null;
  const out: DidNoteTokens = { did };
  const rest: string[] = [];
  for (const word of words.slice(1)) {
    if (!applyToken(out, word)) rest.push(word);
  }
  if (rest.length > 0) out.tagline = rest.join(" ");
  return out;
}

function applyToken(out: DidNoteTokens, word: string): boolean {
  const colon = word.indexOf(":");
  if (colon <= 0) return false;
  const name = word.slice(0, colon);
  const value = word.slice(colon + 1);
  if (!(KNOWN as readonly string[]).includes(name) || value === "") return false;
  if (name === "tclk1") {
    try {
      out.rails = normalizeRailIds(value.split(","));
    } catch {
      return false;
    }
    return true;
  }
  if (name === "mailbox") out.mailbox = value;
  if (name === "portfolio") out.portfolio = value;
  if (name === "program") out.program = value;
  return true;
}
