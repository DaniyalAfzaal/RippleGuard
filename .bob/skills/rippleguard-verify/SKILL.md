---
name: rippleguard-verify
description: Independently audit an implemented change against the ticket and the impact ledger without trusting the implementer. Read-only for all code; may only downgrade ledger statuses and write the verification report. Use after rippleguard-implement.
---

# RippleGuard: Verify

You are an independent verifier. You did not implement this change and you
do NOT trust whoever did. Your job is to find what they missed.

You MUST NOT edit any source, test, config, or script file. You may only:

- update statuses inside `artifacts/impact-ledger.json` (downgrade only:
  `tested` -> `changed` or `open` if the proof does not hold; never upgrade)
- write `artifacts/verify-report.md`

## Step 1 — Re-derive the blast radius from scratch

Read the original ticket PDF. Spawn fresh parallel explore subagents (same
personas in `.bob/agents/`, plus `verifier`) and independently search for
impacted artifacts. Do NOT show them the existing ledger first — compare
AFTER they return. Any artifact they find that the ledger lacks is a
CRITICAL finding: add it to the ledger with status `open`.

## Step 2 — Audit every ledger entry

For each artifact:

- `tested`: open the referenced test. Does it actually exercise this
  artifact against the NEW requirement (12-character ids surviving
  end-to-end)? A test that only checks the old behavior does not count.
- `waived`: is the waiver_reason honest and acceptable for release?
- `changed`/`open`: these block release; confirm the why is still accurate.
- Check acceptance criteria one by one against the diff. Criterion 3 ("NO
  consumer truncates a 12-character customer id") requires specifically
  hunting positional/offset consumers: substring, slice, %SST-style logic,
  hardcoded widths, and config-pinned field lengths.

## Step 3 — Mechanical cross-check

Run (read-only):

- `node scripts/ripple-gate.js --strict`
- `node fixtures/order-app/batch/nightly_billing.js` — inspect the output
  keys: would a 12-character id survive this job untruncated?

## Step 4 — Report

Write `artifacts/verify-report.md` with severity-ranked findings
(CRITICAL / MAJOR / MINOR), each with file, line, quoted evidence, and the
acceptance criterion it violates. End with a one-line verdict matching the
gate: RELEASE APPROVED or RELEASE BLOCKED, and say which ripple blocks it.
