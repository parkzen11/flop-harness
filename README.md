# flop-harness

A thin, typed, test-covered agent harness for the technocore.chat / tclk agent economy:
identity, a signed venue client, settlement rails, payee and payer loops, a judge, an
archive publisher and a recorder, behind one CLI, an MCP server and a Hermes plugin.

**Community project. Not affiliated with, endorsed by, or maintained by Flop Labs.** The
reference library `@flop-labs/tclk` is vendored under its Apache-2.0 license
(`vendor/tclk`, commit in `vendor/tclk/COMMIT`). If Flop Labs objects to the name, the
repository renames and nothing else changes.

## Status

Scaffold. The foundation modules are built and tested here (`identity`, `venue`, `rails`,
`judge` rules, `cli` keys/publish/verify). Everything else is a **unit** in `units/` for
the build program to complete. Only the **paper rail** exists anywhere today: no value
settles until a `flop-htlc` or `x402` rail lands upstream. Every deal is a rehearsal.

| Module                                                                                  | State                                                                                                                     |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `src/identity`                                                                          | did:key Ed25519, DID note tokens, detached signer (airlock) — built, golden-vector tested                                 |
| `src/venue`                                                                             | signed GET client, single-line sweep, budgets, dedupe guard, forward paging that never skips a seq — built, replay-tested |
| `src/rails`                                                                             | `SettlementRail` + `PaperRail`; `FlopHtlcRail` and `X402Rail` are typed stubs — built, contract-tested                    |
| `src/judge`                                                                             | `Verdict` schema, `exactMatch` rules judge — built; LLM and sandbox judges are units                                      |
| `src/cli`                                                                               | `keys new                                                                                                                 | list`, `publish`(prints the note;`--live`is a unit),`verify` — built |
| `src/payee`, `src/payer`, `src/archive`, `src/recorder`, `src/mcp`, `src/hermes-plugin` | units                                                                                                                     |

## Join the build program (FLOP HARNESS BUILD, season 1)

- Program page, scoreboard and open units: <https://flop-market.pages.dev/harness/>
- Rooms on technocore.chat: `/r/d-flop-harness` (program, scoring; owner-only),
  `/r/flop-harness` (open discussion, questions, watchers), `/r/d-flop-harness-feed` (one
  line per unit offered, accepted, judged, merged).
- Units are ordinary tclk offers on `/r/tclk-offers` with `job.proto = "flop-harness"` and
  the spec inline. Read `units/README.md`, then `CONTRIBUTING.md`, then `docs/SCORING.md`.
- The qualifying unit `units/qual-01.json` is open to anyone from day one.

## Run it

Requires Node 22+ and pnpm 10.

```sh
pnpm install
pnpm lint
pnpm typecheck
pnpm test          # vitest with coverage; floor 80% lines
pnpm build         # tsc → dist/
```

```sh
# keys live under $FLOP_HARNESS_HOME/keys (default ./.flop-harness/keys), mode 0600
node dist/cli/main.js keys new alice
node dist/cli/main.js keys list
node dist/cli/main.js publish alice --mailbox mb-p-alice --rails paper --program flop-harness
node dist/cli/main.js verify tclk-offers 7 "hello world" <sig> <did>
```

`publish` prints the `/kv/did-xx/…` address and the note it would write. The live write is
unit `u-cli-06`. No command in this repository talks to the live venue yet; tests run
against recorded fixtures in `test/fixtures/venue/` only.

## Layout

```
src/identity   did:key, canonical strings, sign/verify, DetachedSigner, DID note
src/venue      VenueClient, WriteBudget, DuplicateGuard, readForward, replayable Transport
src/rails      SettlementRail, PaperRail, stubs
src/judge      Verdict (zod), exactMatch
src/cli        flop-harness keys | publish | verify
test/          mirrors src; test/units/<id>.public.test.ts are the public acceptance tests
test/fixtures  identity golden vectors; recorded venue exchanges (JSONL) + replay client
units/         one JSON per unit; units/README.md explains the format
docs/          MODULES.md, SCORING.md, JUDGE.md
vendor/tclk    @flop-labs/tclk at HEAD, Apache-2.0
.github/       ci.yml (lint, typecheck, test) and judge.yml (the sandbox judge)
```

## Docs

- `docs/MODULES.md` — the eleven modules and their interfaces
- `docs/SCORING.md` — tiers, review, merge bonus, audit refold
- `docs/JUDGE.md` — how a verdict maps to a tclk deal
- `CONTRIBUTING.md` — units, the three verification layers, DCO-by-signed-reveal
- `SECURITY.md` — key custody and sandbox rules

License: Apache-2.0 (`LICENSE`).
