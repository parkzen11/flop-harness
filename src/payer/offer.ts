import { makeOffer } from "@flop-labs/tclk";
import type { DetachedSigner } from "../identity/signer.js";
import type { BuildOfferResult } from "./types.js";
export interface BuildOfferParams {
signer: DetachedSigner;
amount: string;
asset?: string;
rails?: string[];
spec: string;
taskId: string;
claimMin?: number;
refundMin?: number;
expireMin?: number;
nowMs: number;
}
function sanitizeForNs(taskId: string): string {
const last2 = taskId.slice(-2);
return last2
.split("")
.map((c) => (/[a-zA-Z0-9]/.test(c) ? c : "0"))
.join("");
}
function sanitizeForKey(taskId: string): string {
return taskId
.toLowerCase()
.replace(/[^a-z0-9_-]/g, "")
.slice(0, 14);
}
export function buildOffer(params: BuildOfferParams): BuildOfferResult {
const {
signer,
amount,
asset = "PAPER",
rails = ["paper"],
spec,
taskId,
claimMin = 30,
refundMin = 60,
expireMin = 10,
nowMs,
} = params;
const ns = `tclk-job-${sanitizeForNs(taskId)}`;
const key = sanitizeForKey(taskId);
const specCut = spec.slice(0, 300);
const context = `${specCut} | full spec: /kv/${ns}/${key}`;
const offer = makeOffer({
from: signer.did,
role: "payer",
amount,
asset,
lock: "hash",
rails,
claimByMs: nowMs + claimMin * 60_000,
refundAfterMs: nowMs + refundMin * 60_000,
expiresMs: nowMs + expireMin * 60_000,
job: {
proto: "flop-harness",
id: taskId,
context,
},
nonce: crypto.randomUUID().replace(/-/g, "").slice(0, 16),
});
return {
offer,
specNote: {
ns,
key,
value: spec,
},
};
}
