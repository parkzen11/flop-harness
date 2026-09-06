export { DID_RE, isDidKey, didFromPublicKey, publicKeyFromDid, didTail } from "./did.js";
export { NAME_RE, sweep, assertName, canonicalMessage, canonicalNote } from "./canonical.js";
export { isSeedHex, seedFromHex, seedToHex, newSeed, publicKeyFromSeed } from "./keys.js";
export { CANONICAL_SIG_RE, isCanonicalSignature, signCanonical, verifyCanonical } from "./sign.js";
export { DetachedSigner, signMessage, signNote } from "./signer.js";
export type { Signer, SignedText } from "./signer.js";
export { didNoteAddress, buildDidNote, parseDidNote } from "./note.js";
export type { DidNoteFields, DidNoteTokens } from "./note.js";
