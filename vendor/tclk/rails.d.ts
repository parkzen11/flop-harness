export { CANONICAL_RAIL_IDS } from "./frame-fields.generated.js";
/** Canonicalize a known rail id or throw loudly on an unknown namespace entry. */
export declare function normalizeRailId(value: string): string;
/** Normalize a rail set: canonical ids, duplicates removed, stable lexical order. */
export declare function normalizeRailIds(values: readonly string[]): string[];
/** True when two rail sets have any canonical rail in common; unknown ids throw. */
export declare function railSetsMatch(left: readonly string[], right: readonly string[]): boolean;
/** Common canonical rails, independent of list order; unknown ids throw. */
export declare function matchingRails(offered: readonly string[], supported: readonly string[]): string[];
/** Membership over canonical ids; unknown inputs throw rather than silently missing. */
export declare function offerIncludesRail(offered: readonly string[], selected: string): boolean;
