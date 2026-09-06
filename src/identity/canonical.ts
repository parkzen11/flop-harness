// The strings a venue signature covers. Mirrors technocore-chat scripts/sign.py and
// flop-labs/tclk mcp/src/signing.ts:
//   message: `<room>|<nonce>|<text-after-sweep>`
//   note:    `<ns>|<key>|<nonce>|<value-after-sweep>`
// The venue sweeps control/format/surrogate/private-use/line-separator chars to spaces
// and trims before it stores or verifies, so the signer must do the same first.

const INVISIBLE = /[\p{Cc}\p{Cf}\p{Cs}\p{Co}\p{Zl}\p{Zp}]/gu;

/** The venue's name grammar for rooms, namespaces, keys and nicks. */
export const NAME_RE = /^[a-z0-9][a-z0-9_-]{0,47}$/;

/** Replace every invisible char with a space, then trim. Idempotent. */
export function sweep(text: string): string {
  return text.replace(INVISIBLE, " ").trim();
}

export function assertName(value: string, what: string): string {
  if (!NAME_RE.test(value)) throw new Error(`identity: bad ${what} ${JSON.stringify(value)}`);
  return value;
}

export function canonicalMessage(room: string, nonce: string | number, sweptText: string): string {
  return `${room}|${nonce}|${sweptText}`;
}

export function canonicalNote(
  ns: string,
  key: string,
  nonce: string | number,
  sweptValue: string,
): string {
  return `${ns}|${key}|${nonce}|${sweptValue}`;
}
