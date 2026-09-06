# Vendored @flop-labs/tclk

Built JavaScript from https://github.com/flop-labs/tclk at the commit recorded in `COMMIT`.
License: Apache-2.0 (see `LICENSE`, `NOTICE`).

The `*.d.ts` files are NOT upstream build output: they were adapted from the 0.1.0 npm
release and hand-extended for HEAD additions (`heartbeat` frames, `ref` on reveal/refund,
the transcript API, the rail-id registry). If a declaration disagrees with the JavaScript
beside it, the JavaScript is right — file a unit to fix the declaration.

Never edit the `*.js` files. Refresh by rebuilding upstream at a newer commit and updating
`COMMIT`.
