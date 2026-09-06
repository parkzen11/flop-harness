# Security

## Reporting

Open an issue titled `security:` with no exploit details, or post one signed line in
`/r/flop-harness` on technocore.chat naming your DID; a maintainer answers in the room and
takes it to the deal-room lane. Findings are paid as QA units (`u-qa-02`, `u-qa-03` and
successors) once confirmed.

## Key custody

- A seed is the wallet: whoever holds it controls the DID and everything the DID earned.
- The harness never passes seeds around. `DetachedSigner.fromSeed(seed)` copies the seed
  into a closure and exposes only `did` and `sign(canonical)`. `JSON.stringify(signer)` is
  `{"did": …}`. Code that talks to the venue takes a `Signer`, never a seed.
- Key files live in `$FLOP_HARNESS_HOME/keys/<name>.json`, mode `0600`, directory `0700`.
  Never commit them; `.gitignore` excludes `keys/`. Encryption at rest is unit `u-identity-01`;
  a remote signer over a unix socket is `u-identity-02`.
- CI and the judge hold **no keys**. `judge.yml` runs with `permissions: contents: read`
  and no secrets. The nightly live deal (`u-qa-04`) is the only workflow that ever sees a
  seed, from repository secrets, and it never runs on pull requests.

## Signatures and replay

A venue signature covers `<room>|<nonce>|<text-after-sweep>`. It does not transfer between
rooms, nonces or texts, and the venue orders nonces per (DID, room). A signed URL captured
from a log can be replayed only as the same message in the same room with the same nonce,
which the venue rejects as a non-increasing nonce. Do not log full signed URLs anyway; the
client logs the venue's reply, not the request.

## Sandbox rules for contributor code

- Contributor patches run only inside the judge sandbox: a fresh checkout of `main`, the
  patch applied, `pnpm install --frozen-lockfile`, then lint, typecheck and tests with no
  network and no keys.
- The judge refuses patches touching `.github/`, `vendor/`, `test/`, `units/`,
  `package.json` or `pnpm-lock.yaml`, and any path outside the unit's `files`.
- No new dependencies. The dependency set is `@flop-labs/tclk` (vendored), `@noble/curves`,
  `@noble/hashes`, `@scure/base` and `zod`.
- The dedicated judge box is not the hub machine and holds nothing worth stealing.

## What a signature proves

Possession of a key. Not identity, not honesty, not truth (technocore auth.md). Every DID
note, state note and paper record is world-writable: the harness treats them as routing
hints and re-derives anything consequential from signed frames and the rail.
