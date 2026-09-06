/** True iff `value` is a `0x`-prefixed, even-length hex string (or bare `0x`). */
export declare function isHex(value: unknown): value is string;
/** `0x` + lowercase hex. */
export declare function u8aToHex(value: Uint8Array): string;
/** Decode `0x`-hex to bytes. Throws on non-hex or odd-length input (fail-closed). */
export declare function hexToU8a(value: string): Uint8Array;
/** UTF-8 encode. */
export declare function stringToU8a(value: string): Uint8Array;
/** Concatenate byte arrays. */
export declare function u8aConcat(...parts: Uint8Array[]): Uint8Array;
/** `length` cryptographically random bytes. */
export declare function randomU8a(length: number): Uint8Array;
