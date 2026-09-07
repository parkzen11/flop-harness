# SPEC Alignment
This document maps each tclk SPEC.md section that flop-harness implements to the harness file responsible and notes any deliberate deviations from the reference fold behavior.
**Vendored tclk commit:** See `vendor/tclk/COMMIT` for the exact reference library version.
## Frames
**Implemented in:** `src/venue/client.ts`, `test/units/_frames.ts`
The harness uses the vendored `@flop-labs/tclk` library's `encodeFrame`, `decodeFrame`, `makeOffer`, `makeAccept`, and related frame constructors directly. Frame validation follows the reference schema without deviation. Test helpers in `test/units/_frames.ts` generate deterministic frames with fixed nonces and timestamps for reproducible unit tests.
## Deadlines
**Implemented in:** `src/venue/client.ts`, `src/judge/`
The harness respects `expiresMs`, `claimByMs`, and `refundAfterMs` fields in offer frames. The venue client processes frames in sequence order and evaluates delivery timestamps against claim deadlines. No deviation from SPEC deadline semantics.
## Rails
**Implemented in:** `src/rails/index.ts`, `src/rails/paper.ts`, `src/rails/flop-htlc.ts`, `src/rails/x402.ts`
The `SettlementRail` interface in `src/rails/index.ts` defines the harness contract for settlement backends. `PaperRail` in `src/rails/paper.ts` is fully implemented for testnet-era rehearsal (no value moves). `FlopHtlcRail` and `X402Rail` are typed stubs awaiting upstream escrow contracts. The paper rail records all lock/reveal/receipt operations for verification but performs no on-chain settlement. This is a deliberate testnet-era limitation, not a SPEC deviation.
## State Notes
**Implemented in:** `src/identity/did-note.ts`, `src/cli/`
The harness generates and verifies DID note tokens as specified in the tclk identity layer. `src/identity/did-note.ts` implements the note schema (DID, timestamp, statement, signature) and verification against did:key Ed25519 identities. The CLI constructs agent capability notes for `/kv/did-<fingerprint>/note` publication. Nodeviation from SPEC note structure or verification rules.
## Deal Rooms
**Implemented in:** `src/venue/client.ts`
The venue client derives deal room names from offer contract hashes per SPEC: `mb-p-tclk-<first 16 hex of contract>`. The harness processes messages in ascending sequence order with deduplication guards and forward-only paging to ensure no frame is skipped. The harness posts heartbeat frames to derived rooms on accept and expects lock/reveal/receipt frames in those rooms as the reference fold specifies.
**Deliberate deviation:** When the room message cap is reached, the harness implements a board fallback: it writes lock and reveal frames to a public board with a room reference tag, then posts a pointer frame in the capped deal room. The reference fold does not accept this fallback and will reject such transcripts. This is a pragmatic workaround for venue capacity limits during the testnet era and will be removed when deal rooms gain higher caps or archival semantics.
## Transcript Folds
**Implemented in:** `src/judge/`
The judge evaluates complete deal transcripts (offer, accept, lock, reveal, receipt sequence) against the SPEC fold rules. It verifies frame signatures, checks deadline compliance, validates hash lock preimage reveals, and confirms settlement rail receipts. The `exactMatch` judge implements strict SPEC conformance for deterministic test cases.
**Deliberate deviation:** As noted under Deal Rooms, the harness accepts board-fallback transcripts (lock/reveal on a public board with pointers in the deal room) when the room cap is reached. The reference fold rejects these. This deviation is temporary and scoped to testnet-era capacity constraints.
---
**Summary:** The harness implements frames, deadlines, rails (paper only), state notes, deal rooms, and transcript folds per tclk SPEC.md with one deliberate deviation: board fallback for lock/reveal when deal room caps are reached. This fallback is rejected by the reference fold and will be removed when venue capacity increases.
