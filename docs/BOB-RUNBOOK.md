# How IBM Bob was used

One task per phase, new chat each time. Session reports are in
`bob_sessions/`.

## Workspace for Bob

```bash
node scripts/export-for-bob.js
```

Open the exported folder in Bob IDE. After each phase, copy back
`artifacts/impact-ledger.json`, `artifacts/verify-report.md`, fixture
changes under `fixtures/order-app/`, and the session export.

---

## Task 1 — ANALYZE

Workspace: the exported `../rippleguard-bob` folder. Mode: Agent. New task.
Prompt:

```
Activate the rippleguard-analyze skill.

The change ticket is @/tickets/CHG-1042-customer-id-expansion.pdf — read it
with your document understanding.

Perform the full impact analysis of fixtures/order-app as the skill
describes: spawn the parallel explore subagents (data-explorer,
code-explorer, batch-explorer, api-explorer, test-explorer personas), merge
their evidence, and write artifacts/impact-ledger.json conforming to
artifacts/impact-ledger.schema.json with every entry status "open".

Remember: consumers may reference the field by alias or by raw positional
offsets with no name at all, and operational docs may document consumers
that code search misses. Do not modify any file other than
artifacts/impact-ledger.json.
```

Success check (before closing the task):
- `artifacts/impact-ledger.json` exists and validates against the schema
- Run `node scripts/ripple-gate.js` — expect **RELEASE BLOCKED** with all
  entries open (nothing is implemented yet)
- The three artifacts grep misses are `orderService.js`, `nightly_billing.js`,
  `feed-layout.json` — the ledger should include all three
- Screenshot the parallel-subagents panel

If Bob missed artifacts: do NOT argue in chat. Close the task, tighten the
relevant persona file in `.bob/agents/`, and rerun ONCE as a fresh task.

---

## Task 2 — IMPLEMENT (YOU, 8-10 coins)

New task. Mode: Agent. Prompt:

```
Activate the rippleguard-implement skill.

Implement change ticket @/tickets/CHG-1042-customer-id-expansion.pdf using
artifacts/impact-ledger.json as the authorized scope, with ONE restriction:
do not modify anything under fixtures/order-app/batch/ — batch jobs require
Finance Ops sign-off which we do not have yet. Leave those ledger entries
"open".

For everything else in the ledger: make the change, add or update tests
proving 12-character customer ids work end to end, run
node --test "fixtures/order-app/tests/*.test.js" until green, and advance
ledger statuses to "tested" (or "waived" with an honest reason for
non-executable artifacts). Then run node scripts/ripple-gate.js and report
its verdict exactly.
```

The batch restriction is the realistic enterprise constraint that produces
the red-gate demo moment. Expected result: tests green, gate **BLOCKED** on
NIGHTLY_BILLING (and PARTNER_FEED if Bob classifies it under batch/ — that
is fine, the story is identical).

---

## Task 3 — VERIFY (YOU, 4-6 coins)

New task. Prompt:

```
Activate the rippleguard-verify skill.

Independently audit the implementation of
@/tickets/CHG-1042-customer-id-expansion.pdf. Re-derive the blast radius
from scratch with fresh explore subagents before you look at
artifacts/impact-ledger.json, then audit every ledger status. You are
read-only for all code: you may only downgrade ledger statuses and write
artifacts/verify-report.md.

Also run node fixtures/order-app/batch/nightly_billing.js and state whether
a 12-character customer id would survive that job untruncated. Finish with
node scripts/ripple-gate.js --strict and report the verdict verbatim.
```

Expected: verifier confirms the truncation in the batch job, gate stays
**BLOCKED**. Record this on video — it is the climax setup.

---

## Task 4 — FIX + GREEN SHIP (YOU, 6-8 coins)

New task. Prompt:

```
Activate the rippleguard-implement skill.

Finance Ops sign-off has been granted for CHG-1042 (reference:
docs/ops/BILLING-RUNBOOK.md ownership note). Scope: ONLY the ledger entries
still "open" — the batch consumers under fixtures/order-app/batch/ and the
partner feed spec in config/feed-layout.json if unresolved.

Fix the positional-offset truncation in nightly_billing.js for 12-character
customer ids, bump the partner feed layout to V2 with the widened CUST_KEY,
add regression tests proving a 12-character id survives both jobs, update
the ledger statuses, update docs/ops/BILLING-RUNBOOK.md to describe the new
widths, and run node scripts/ripple-gate.js --strict. Report the verdict
verbatim.
```

Expected: **RELEASE APPROVED**, certificate green. Record the flip.

---

## Exporting sessions (after EVERY task)

1. Bob IDE chat → Views and More Actions → **History**
2. Select the task → click the task header → consumption summary appears
3. **Screenshot** the consumption summary → save as
   `bob_sessions/<member>-task<N>-summary.png`
4. Click **Export task history** → save markdown as
   `bob_sessions/<member>-task<N>-<phase>.md`
5. Log coins spent in `docs/METRICS.md` immediately

## Hard rules

- Confirm the team is `ibm-coding-challenge-xxx` in Bob Settings BEFORE the
  first task. Personal accounts are a rank-killer.
- Never paste credentials or API keys into Bob or this repo.
- Never rebuild the UI, gate, or docs inside Bob. Those stay in this repo.
- One rerun max per phase. If a phase fails twice, stop and reassess here.
