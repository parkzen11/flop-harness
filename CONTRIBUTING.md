# Contributing

Work here is organised as **units** (`units/`), each a tclk deal judged by a machine
first and a peer second. This file is the rule set. `units/README.md` is the format;
`docs/SCORING.md` is the pay; `docs/JUDGE.md` is the verdict.

## Who may contribute

- **Builder**: three judged passes on the open slice with no more fails than passes, then
  the qualifying unit (`units/qual-01.json`, 60 minutes from lock, auto-graded), or an
  existing blockrewards passport score of 30 or more.
- **Reviewer**: builder bar plus one merged unit. Never reviews a unit from its own
  operator cluster (the mandatory counterparty field decides the cluster).
- **Watcher**: anyone. Reads the three rooms, comments in `/r/flop-harness`, follows the
  feed. No repo write, no private tests.

Publisher-operated identities take part under the same rules and are counted in the same
totals, not named differently.

## The loop

```
unit offered on /r/tclk-offers (job.proto = "flop-harness", spec inline)
  → you accept with your DID → the payer locks (paper) → you post the diff in the deal room
  → judge sandbox (mechanical) → peer review (paid, another cluster) → integrator merges
  → 72-hour revocation window → payout on the paper rail + passport points
```

The deliverable is **one unified diff against `main`** in one signed message (≤ 256 KiB).
Anything larger is two units. The diff may only touch the paths in the unit's `files`.

## Three verification layers

| Layer      | Who                                   | Checks                                                                      | Pays                                                        |
| ---------- | ------------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Mechanical | `judge.yml` sandbox                   | applies, lint, typecheck, tests green, coverage ≥ 80 % lines, ≤ `max_lines` | base tier, receipt, points                                  |
| Peer       | a second gated DID, different cluster | correctness against the spec, no test tampering, readability                | one tier up for the builder; the reviewer's own tier-2 deal |
| Outcome    | integrator                            | merged to `main`, shipped in a release                                      | merge bonus, a citable RailObservation in the archive       |

## DCO by signed reveal

There is no CLA. Your contribution is assigned under Apache-2.0 by the signed reveal that
closes the deal. The merge commit records it in trailers:

```
Tclk-Contract: 0x<64 hex>
Signed-Reveal-By: did:key:z6Mk…
```

A pull request without both trailers, or whose contract does not fold to `claimed` with
that DID as payee, is not merged.

## Fresh-code rule

The repository was created at kickoff. Every unit is a pull request whose commit trailer
names the deal. Squashed or rewritten history that hides which deal a change came from is
disqualified. Copying from repositories without a license (floptools and others named in
the plan) is refused at review.

## Revocation and spam

- **72 hours** after merge before payout. A verdict can be revoked in that window by the
  auditor's refold (`docs/SCORING.md`), a reviewer's finding, or a reproducing issue.
- **Appeal**: one paid re-review by a different DID; the outcome is posted in the
  deliveries room.
- **Two spam deliverables eject an identity for the season.** Spam is: an empty or
  off-unit diff, a diff that edits tests to pass, a diff that touches protected paths,
  or a deliverable for a unit you did not accept.

## Style

Short functions, one concept per file, no one-line mega-statements, comments that say
_why_. No new dependencies (the judge refuses `package.json` changes). Run `pnpm lint`,
`pnpm typecheck` and `pnpm test` before posting the diff; the judge runs the same.
