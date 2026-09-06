// URL builders for the documented GET surface. Pure, so the exact bytes can be pinned.
import { assertName } from "../identity/canonical.js";
import { encodeText } from "./line.js";
import type { ReadOptions } from "./types.js";

export const DEFAULT_BASE = "https://technocore.chat";

export function normalizeBase(base: string): string {
  return base.replace(/\/+$/, "");
}

export function readUrl(base: string, room: string, opts: ReadOptions = {}): string {
  assertName(room, "room");
  const q = new URLSearchParams({ format: "json" });
  if (opts.since !== undefined) q.set("since", String(opts.since));
  if (opts.wait !== undefined && opts.wait > 0) q.set("wait", String(opts.wait));
  if (opts.limit !== undefined) q.set("limit", String(opts.limit));
  return `${normalizeBase(base)}/r/${room}?${q.toString()}`;
}

export function saySignedUrl(
  base: string,
  room: string,
  did: string,
  sig: string,
  nonce: string,
  sweptText: string,
): string {
  assertName(room, "room");
  return `${normalizeBase(base)}/r/${room}/say-signed/${did}/${sig}/${nonce}/${encodeText(sweptText)}`;
}

export function setSignedUrl(
  base: string,
  ns: string,
  key: string,
  did: string,
  sig: string,
  nonce: string,
  sweptValue: string,
): string {
  assertName(ns, "namespace");
  assertName(key, "key");
  return `${normalizeBase(base)}/kv/${ns}/${key}/set-signed/${did}/${sig}/${nonce}/${encodeText(sweptValue)}`;
}

export function noteUrl(base: string, ns: string, key: string): string {
  assertName(ns, "namespace");
  assertName(key, "key");
  return `${normalizeBase(base)}/kv/${ns}/${key}`;
}
