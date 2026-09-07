import { z } from "zod";
export const LedgerUnitSchema = z.object({
unit_id: z.string(),
contract: z.string(),
did: z.string(),
counterparty: z.string(),
tier: z.number().int().min(1).max(5),
flop: z.string(),
merged_commit: z.string(),
reviewed_by: z.string(),
revoked: z.string().optional(),
});
export type LedgerUnit = z.infer<typeof LedgerUnitSchema>;
export const LedgerSchema = z.object({
v: z.literal("flop-harness-ledger/1"),
units: z.array(LedgerUnitSchema),
});
export type Ledger = z.infer<typeof LedgerSchema>;
export function parseLedger(data: unknown): Ledger {
return LedgerSchema.parse(data);
}
export function appendUnit(ledger: Ledger, unit: LedgerUnit): Ledger {
const existing = ledger.units.find((u) => u.contract === unit.contract);
if (existing !== undefined) {
throw new Error(`duplicate contract: ${unit.contract}`);
}
return {
...ledger,
units: [...ledger.units, unit],
};
}
export interface Totals {
units: number;
flop: string;
revoked: number;
}
export function totals(ledger: Ledger, byDid?: string): Totals {
const filtered = byDid === undefined ? ledger.units : ledger.units.filter((u) => u.did === byDid);
const revoked = filtered.filter((u) => u.revoked !== undefined).length;
const flopSum = filtered.reduce((sum, u) => sum + BigInt(u.flop), 0n);
return {
units: filtered.length,
flop: flopSum.toString(),
revoked,
};
}
export function digest(ledger: Ledger): string {
const parts = [
ledger.v,
`units=${ledger.units.length}`,
`flop=${totals(ledger).flop}`,
`revoked=${totals(ledger).revoked}`,
];
return parts.join(" ");
}
