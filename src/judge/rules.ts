import type { Judge, JudgeInput } from "./types.js";
import type { Verdict } from "./verdict.js";
export interface RulesJudgeOptions {
minChars?: number;
forbidden?: string[];
}
export class RulesJudge implements Judge {
public readonly id = "rules";
private readonly minChars: number;
private readonly forbidden: string[];
constructor(opts: RulesJudgeOptions = {}) {
this.minChars = opts.minChars ?? 80;
this.forbidden = opts.forbidden ?? ["as an AI", "I cannot", "not found in the cited source"];
}
async judge(input: JudgeInput): Promise<Verdict> {
const reasons: string[] = [];
let pass = true;
let score = 0.5;
const deliverable = input.deliverables.join("\n");
const specText = typeof input.spec === "string" ? input.spec : JSON.stringify(input.spec);
// Check minimum character count
if (deliverable.length < this.minChars) {
pass = false;
reasons.push(`Deliverable too short: ${deliverable.length} chars (minimum ${this.minChars})`);
}
// Extract URLs from spec
const specUrls = this.extractUrls(specText);
// Check forbidden phrases
for (const phrase of this.forbidden) {
const lowerPhrase = phrase.toLowerCase();
const lowerDeliverable = deliverable.toLowerCase();
if (lowerPhrase === "not found in the cited source") {
// Special handling: only forbidden if it doesn't name a spec URL
if (lowerDeliverable.includes(lowerPhrase)) {
const delUrls = this.extractUrls(deliverable);
const hasSpecUrl = delUrls.some((url) => specUrls.includes(url));
if (!hasSpecUrl) {
pass = false;
reasons.push(`Forbidden phrase "${phrase}" without naming the cited source`);
}
}
} else {
// Regular forbidden phrase check
if (lowerDeliverable.includes(lowerPhrase)) {
pass = false;
reasons.push(`Forbidden phrase: "${phrase}"`);
}
}
}
// Check for source-quoting bonus
if (pass) {
const hasQuote = /"[^"]+"/g.test(deliverable);
const delUrls = this.extractUrls(deliverable);
const hasSpecUrl = delUrls.some((url) => specUrls.includes(url));
if (hasQuote && hasSpecUrl) {
score = 1;
reasons.push("Bonus: quotes the source with URL from spec");
}
}
if (pass && reasons.length === 0) {
reasons.push("Passes structural checks");
}
return {
judge: this.id,
pass,
score: pass ? score : 0,
reasons,
};
}
private extractUrls(text: string): string[] {
const urlPattern = /https?:\/\/[^\s)">]+/gi;
const matches = text.match(urlPattern);
return matches ? matches.map((url) => url.replace(/[.,;:!?]+$/, "")) : [];
}
}
