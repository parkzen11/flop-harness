import type { NoteStore } from "@flop-labs/tclk";
import type { Transport } from "./types.js";
export function venueNoteStore(transport: Transport, base: string): NoteStore {
return {
async get(ns: string, key: string): Promise<string | null> {
const url = `${base}/kv/${ns}/${key}`;
const response = await transport({ method: "GET", url });
if (response.status === 404) {
return null;
}
if (response.status < 200 || response.status >= 300) {
throw new Error(`GET ${url} failed with status ${response.status}`);
}
const lines = response.body.split("\n");
const contentLines = lines.filter((line) => !line.startsWith("!!"));
return contentLines.join("\n").trim();
},
async set(
ns: string,
key: string,
value: string,
options?: { ifAbsent?: boolean; if?: string },
): Promise<boolean> {
const params = new URLSearchParams();
if (options?.ifAbsent) {
params.set("if_absent", "1");
} else if (options?.if !== undefined) {
params.set("if", options.if);
}
const query = params.toString();
const url = `${base}/kv/${ns}/${key}${query ? `?${query}` : ""}`;
const body = JSON.stringify({ value });
const response = await transport({ method: "POST", url, body });
if (response.status === 409) {
return false;
}
if (response.status < 200 || response.status >= 300) {
throw new Error(`POST ${url} failed with status ${response.status}`);
}
return true;
},
};
}
