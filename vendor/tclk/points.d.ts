export declare const SECP256K1_N: bigint;
/** A point lock: the public `statement` (Y) and its secret `witness` (y), both 0x-hex. */
export interface PointLock {
    /** 32-byte big-endian scalar `y`, 0x-prefixed. Keep secret until release. */
    witness: string;
    /** 33-byte SEC1-compressed `Y = y·G`, 0x-prefixed. Safe to publish. */
    statement: string;
}
/** Derive the point lock for a given 32-byte scalar witness `y` (0x-hex or bytes). */
export declare function pointLockFromWitness(witness: string | Uint8Array): PointLock;
/** Mint a fresh random point lock `(y, Y=y·G)`. */
export declare function generatePointLock(): PointLock;
/** True iff `witness` (y) is the discrete-log of `statement` (Y): `compressed(y·G) == Y`. */
export declare function verifyPointWitness(statement: string, witness: string | Uint8Array): boolean;
/** A valid SEC1-compressed secp256k1 point: 33 bytes, prefix 0x02/0x03, on the curve. */
export declare function isValidPointStatement(statement: string): boolean;
