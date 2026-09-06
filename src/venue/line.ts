// Everything the venue stores is one line of at most MAX_TEXT_CHARS. A signed write travels
// in the URL path, percent-encoded, so the encoded form has its own ceiling. Both checks
// run before signing: a text that would be cut or refused must never be signed.
import { sweep } from "../identity/canonical.js";
import { TextTooLongError, UrlTooLongError } from "./errors.js";

/** The venue's per-message cap (same number tclk uses for a frame). */
export const MAX_TEXT_CHARS = 4096;
/** Conservative ceiling for the whole signed-GET url after percent-encoding. */
export const MAX_URL_CHARS = 16_384;

const LINE_BREAKS = /[\r\n\u2028\u2029]+/g;

/** Collapse line breaks to single spaces, then apply the venue sweep. Idempotent. */
export function singleLine(text: string): string {
  return sweep(text.replace(LINE_BREAKS, " "));
}

/** Percent-encode a text for the url path; keeps the venue's own decoding rules. */
export function encodeText(text: string): string {
  return encodeURIComponent(text);
}

/** Throw if the (already swept) text exceeds the venue cap. Returns the text unchanged. */
export function assertTextBudget(text: string, limit = MAX_TEXT_CHARS): string {
  if (text.length > limit) throw new TextTooLongError(text.length, limit);
  return text;
}

/** Throw if a full url would exceed the encoded ceiling. Returns the url unchanged. */
export function assertUrlBudget(url: string, limit = MAX_URL_CHARS): string {
  if (url.length > limit) throw new UrlTooLongError(url.length, limit);
  return url;
}
