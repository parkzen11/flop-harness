import { canonicalJson } from "@flop-labs/tclk";
import { createHash } from "node:crypto";
import { z } from "zod";
const ExportSchema = z.object({
path: z.string(),
sha256: z.string(),
});
const DealSchema = z.object({
contract: z.string(),
offerId: z.string(),
role: z.enum(["payer", "payee"]),
counterparty: z.string(),
asset: z.string(),
amount: z.string(),
rail: z.string(),
status: z.string(),
rooms: z.array(z.string()),
exports: z.array(ExportSchema),
});
const PortfolioSchema = z.object({
v: z.literal("tclk-portfolio/1"),
did: z.string(),
generatedAt: z.string(),
deals: z.array(DealSchema),
});
export type Portfolio = z.infer<typeof PortfolioSchema>;
export type Deal = z.infer<typeof DealSchema>;
export type Export = z.infer<typeof ExportSchema>;
export function parsePortfolio(data: unknown): Portfolio {
return PortfolioSchema.parse(data);
}
export function digest(portfolio: Portfolio): string {
const canonical = canonicalJson(portfolio);
return createHash("sha256").update(canonical, "utf8").digest("hex");
}
