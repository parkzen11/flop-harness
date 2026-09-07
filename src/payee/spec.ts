import type { OfferFrame } from "@flop-labs/tclk";
interface Notes {
get(ns: string, key: string): Promise<string | null>;
}
const KV_POINTER_REGEX = /^\/kv\/([^/]+)\/(.+)$/;
const KV_REFERENCE_REGEX = /\/kv\/([^/]+)\/(\S+)/;
export async function readSpec(
offer: OfferFrame,
notes: Notes,
): Promise<string | null> {
const context = offer.job?.context;
if (!context) {
return null;
}
const pointerMatch = context.match(KV_POINTER_REGEX);
if (pointerMatch) {
const [, ns, key] = pointerMatch;
try {
return await notes.get(ns!, key!);
} catch {
return null;
}
}
if (context.length >= 12) {
const refMatch = context.match(KV_REFERENCE_REGEX);
if (refMatch) {
const [, ns, key] = refMatch;
try {
const fullSpec = await notes.get(ns!, key!);
if (fullSpec !== null) {
return `${context} | full spec: ${fullSpec}`;
}
} catch {
// If fetch fails, just return the inline text
}
}
return context;
}
return null;
}
