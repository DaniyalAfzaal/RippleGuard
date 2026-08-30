---
name: rippleguard-implement
description: Implement a change ticket strictly within the blast radius recorded in artifacts/impact-ledger.json, updating ledger statuses (open -> changed -> tested) with tests as proof. Use after rippleguard-analyze has produced the ledger.
---

# RippleGuard: Implement

You implement ONLY what the impact ledger authorizes. The ledger at
`artifacts/impact-ledger.json` is the single source of truth for scope.

## Rules

1. Read the ticket and the ledger first. If the user restricts scope (for
   example "everything except batch/ — batch jobs need Finance Ops
   sign-off"), honor it exactly: out-of-scope entries KEEP status `open`.
   Never silently expand scope.
2. For each in-scope artifact:
   - make the required change
   - set its ledger status to `changed`
   - add or update a test that proves the change, run it, and only then
     advance the status to `tested` with the test path in the `test` field
3. Artifacts that cannot have an executable test (SQL DDL with no local
   engine, documentation) may be set to `waived` — but only with an honest
   `waiver_reason`.
4. Keep the ledger's `evidence` intact; append new evidence if you touch
   different lines than originally recorded.
5. Run the full suite with `node --test "fixtures/order-app/tests/*.test.js"`
   and fix regressions you introduced.
6. Do NOT edit `scripts/ripple-gate.js` or anything under `bob_sessions/`.

## For ticket CHG-1042 specifically

- Transition validation: ids of length 9 (AAA999999) AND length 12
  (AAA999999999) are both valid input.
- Fixed-width record fields widen to 12; downstream offsets shift; legacy
  ids are right-padded.
- The partner feed spec bumps to V2 with the widened CUST_KEY and new
  record_length.
- R2 adds `GET /orders/{orderNo}/status` returning
  `{ orderNo, customerId, status, statusName, statusDate }` with 400/404
  error handling, plus tests.

## Finish

Update the ledger, then run `node scripts/ripple-gate.js` and report its
verdict honestly. If the gate blocks, say exactly which ripples are
unresolved and why they were out of your authorized scope.
