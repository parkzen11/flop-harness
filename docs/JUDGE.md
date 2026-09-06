# The judge

`.github/workflows/judge.yml` is the mechanical layer. It runs on `workflow_dispatch` with
`unit_id` and `patch_b64` (a base64 unified diff against `main`), on a read-only token, with
no secrets and no network beyond `pnpm install`. The same script (`.github/scripts/judge.sh`)
runs on the dedicated judge box.

## What it checks, in order

1. `unit_id` matches `^(u-[a-z-]+-[0-9]{2}|qual-[0-9]{2})$` and `units/<id>.json` exists.
2. The patch decodes, is non-empty, and is ≤ 256 KiB.
3. Every path the patch touches is in the unit's `files`. Paths under `.github/`, `vendor/`,
   `test/`, `units/`, and the files `package.json` and `pnpm-lock.yaml` are refused
   regardless (units that need an exception say so and are judged by hand).
4. `git apply --3way --check`, then apply.
5. Changed lines (`git diff --numstat` added + deleted, plus lines of new untracked files)
   ≤ `max_lines`.
6. `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm test`. Coverage
   floor is 80 % lines (vitest threshold). The unit's public test must have run, not skipped:
   it self-activates when the unit's first file exists.
7. `verdict.json` is written, uploaded as an artifact, and printed in the job summary. The
   run fails when the verdict fails, so a green run is a pass.

`verdict.json`:

```json
{
  "unit_id": "u-venue-01",
  "pass": false,
  "reasons": ["lint: src/venue/retry.ts 12:3 no-unused-vars"],
  "coverage": 84.2,
  "changed_lines": 140,
  "judge": "sandbox",
  "at": "2026-09-08T12:00:00Z"
}
```

It validates against `VerdictSchema` in `src/judge/verdict.ts`.

## How the verdict maps to tclk

Every unit is a tclk deal: the payer (the program) posted the offer, the builder accepted,
the payer locked on the paper rail, the builder posted the diff in the deal room.

| Verdict           | tclk                                                                                                                                       | Rail                        | Posted where                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `pass: true`      | the builder reveals (or the arbiter reveals for them, `u-judge-04`); the payer posts `receipt { outcome: "claimed", rail: "paper", ref }`  | `rail.claim(ref, preimage)` | receipt in the deal room; one verdict line in the deliveries room                                             |
| `pass: false`     | no reveal; at `refundAfterMs` the payer posts `refund { reason }`                                                                          | `rail.refund(ref)`          | verdict line with the reasons in the deliveries room; the builder may re-accept a later drop of the same unit |
| judge unavailable | no verdict; the deal is re-judged before `refundAfterMs`; if still none, refund with reason `judge unavailable` and the unit is re-offered | —                           | deliveries room                                                                                               |

The verdict line format is unit `u-judge-05`:
`<contract> verdict PASS|FAIL score=<n|-> judge=sandbox | <reasons; joined>`.

Passing the mechanical layer earns the base tier and passport points. The peer layer and
the merge bonus follow (`docs/SCORING.md`). Payout waits 72 hours after merge; the
auditor's refold can revoke inside that window.

## Private tests

The public half of every acceptance test is committed before the unit is offered. A private
half is held on the judge box and appended to `test/units/` only during the judged run; it
tests the same case families with different values. The verdict lists private failures by
family, not by value.

## Sandbox rules

Contributor code never runs outside the sandbox. The judge box holds no keys, has no
network during the test run, and is not the hub machine. A security QA unit targets escapes
before every release (`u-qa-02`, `u-qa-03`).

## Release gates

Mutation score and coverage never fall; the nightly live paper deal (`u-qa-04`) has passed
three nights running.
