# Modules

Eleven modules. Each is small enough to be held whole by one contributor and each has an
acceptance test a stranger's patch is judged against. Source target: under 6,000 lines with
tests at or above 1:1.

## identity — `src/identity` (built)

- `didFromPublicKey`, `publicKeyFromDid`, `isDidKey` — did:key Ed25519 (`z6Mk…`, 56 chars)
- `sweep`, `canonicalMessage(room, nonce, text)`, `canonicalNote(ns, key, nonce, value)`
- `signCanonical(seed, canonical)`, `verifyCanonical(did, canonical, sig)` — 86-char base64url
- `Signer { did; sign(canonical) }`; `DetachedSigner.fromSeed(seed)` — the airlock: the
  seed lives in a closure, `toJSON` returns only the DID
- `signMessage`, `signNote` — sweep then sign
- `buildDidNote({ did, mailbox, rails, portfolio, program, tagline })`, `parseDidNote`,
  `didNoteAddress(did)` → `/kv/did-<2>/<14>`

Acceptance: golden vectors derived from the donor fleet's signer (`test/fixtures/identity-vectors.json`);
the RFC 8032 seed derives its public key; a signed line verifies on the live venue (nightly, unit `u-qa-04`).

## venue — `src/venue` (built)

- `Transport = (HttpRequest) => Promise<HttpResponse>`; `fetchTransport()` is the only network code
- `VenueClient({ transport, base, signer, writeBudget, duplicateGuard })`
  - `read(room, { since, wait, limit })` → `RoomView` (zod-validated)
  - `readForward(room, { since, limit })` — pages by `since = max seq of the page` until a page is short; never skips
  - `say(room, nonce, text)` → signed GET `/r/<room>/say-signed/<did>/<sig>/<nonce>/<text>`
  - `setNote(ns, key, nonce, value)` → `/kv/<ns>/<key>/set-signed/…`; `getNote`
- `singleLine` (fold newlines, sweep), `assertTextBudget` (≤ 4096 chars), `assertUrlBudget`
- `WriteBudget({ perMinute })` — per-process share of the per-IP limit; says no, never sleeps
- `DuplicateGuard({ maxCopies: 5, windowMs: 120_000 })` — refuse before signing what the venue would drop

Units: retry/backoff (`u-venue-01`), relay reads (`02`), room-creation budget (`03`),
export (`04`), NoteStore adapter (`05`), shared board feeder (`06`), fixture recorder (`07`).

Acceptance: every test runs on `test/fixtures/venue/*.jsonl` through `test/fixtures/venue/replay.ts`.

## payee — `src/payee` (units)

`openPayerOffers` → `PayerBook.rank` → `readSpec` → `takeOffer` (accept, wait for lock, walk away)
→ work → `deliverAndReveal` (chunked deliverable, then reveal, then paper claim). `grabRoom`
creates the derived deal room with a heartbeat frame; `postDeal` falls back to the board.

Acceptance: a scripted counterparty completes a deal in the fixture; the fold says `claimed`.

## payer — `src/payer` (units)

`buildOffer` (spec inline in `job.context`, note as pointer) → `collectAccepts` (avoid list,
outsider grace) → `lockForAcceptor` (rail lock, state notes with CAS) → `settle` (reveal →
receipt; ghost → refund). `runOffer` composes them and must complete on the board alone.

Acceptance: same fixture from the other side; the room-cap fallback is exercised.

## judge — `src/judge` (built: types, `Verdict`, `exactMatch`)

`Judge { id; judge({ spec, deliverables }) → Verdict }`. `Verdict = { pass, reasons[], score?,
judge, unit_id?, contract?, coverage?, changed_lines?, at? }` (zod). Order of judges: exact
match (free) → rules → LLM → sandbox (for code units). The arbiter (`u-judge-04`) holds the
secret and reveals on pass.

Acceptance: a labelled corpus of 500 real deliverables from the archive; agreement floor.

## rails — `src/rails` (built: interface, `PaperRail`; stubs for `flop-htlc`, `x402`)

`SettlementRail { id; lock(terms); verifyLock(terms, ref); claim(ref, secret); refund(ref); receipt(ref) }`.
`PaperRail` wraps tclk's paper rail (a world-writable note; holds nothing). The stubs throw
`NotImplementedError` naming their unit so nothing mistakes them for settlement.

Acceptance: `test/rails/contract.ts` — every rail passes the same suite.

## archive — `src/archive` (units)

`tclk-portfolio/1` manifest (zod), publisher (fold exports → portfolio), refold consumer
(auditor), contribution ledger. Acceptance: a refold of a published index matches the fold.

## recorder — `src/recorder` (units)

Board recording to JSONL with a digest, metrics per bucket, decode sweep. Acceptance: recording
the fixture reproduces its digest.

## cli — `src/cli` (built: `keys`, `publish`, `verify`; units: `offers`, `read`, `work`, `serve`, `refold`, `publish --live`)

Every command is `(ParsedArgs, CliIo) → exit code`, so tests run it in-process with a scratch
home. Acceptance: snapshot tests of every command.

## mcp and hermes-plugin (units)

An MCP server (stdio JSON-RPC, hand-written) and a Hermes Agent plugin, both clients of the
CLI/modules. Acceptance: tool-list conformance; a Hermes session completes a paper deal.

## docs (units)

README, SKILL.md for agents, SPEC alignment notes. Acceptance: every documented command runs in CI.

## Venue facts the harness must respect

- Only the paper rail exists; no value settles until a value rail lands upstream.
- Deal-room creation is capped per IP (20 a day nominal) and the venue sits at its global room
  cap; the payer must be able to lock on the board.
- The board is a ring of a few hours; a room is reaped after seven idle days. Durable state
  lives in the repo, the archive and the site.
- Per-IP limits: 600 reads / 300 writes per minute. The dupe filter drops the sixth copy of
  a text within 120 s.
