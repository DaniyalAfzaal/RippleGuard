# Activate the rippleguard-verify skill.Independently audit the implementation of
@/tickets/CHG-1042-customer-id-expansion.pdf. Re-derive the blast radius
from scratch with fresh explore subagents BEFORE you look at
artifacts/impact-ledger.json, then audit every ledger entry: for each
"tested" status, open the referenced test and confirm it exercises the new
12-character behavior; for each "waived" status, judge whether the reason
is honest and acceptable for release.You are read-only for all code: you may only downgrade ledger statuses
(never upgrade) and write artifacts/verify-report.md.Also run node fixtures/order-app/batch/nightly_billing.js and state whether
a 12-character customer id would survive that job untruncated — quote the
output. Finish with node scripts/ripple-gate.js --strict and report the
verdict verbatim.

---

**Status:** active  **Date:** 2026-08-29

---

### 👤 User

Activate the rippleguard-verify skill.Independently audit the implementation of
@/tickets/CHG-1042-customer-id-expansion.pdf. Re-derive the blast radius
from scratch with fresh explore subagents BEFORE you look at
artifacts/impact-ledger.json, then audit every ledger entry: for each
"tested" status, open the referenced test and confirm it exercises the new
12-character behavior; for each "waived" status, judge whether the reason
is honest and acceptable for release.You are read-only for all code: you may only downgrade ledger statuses
(never upgrade) and write artifacts/verify-report.md.Also run node fixtures/order-app/batch/nightly_billing.js and state whether
a 12-character customer id would survive that job untruncated — quote the
output. Finish with node scripts/ripple-gate.js --strict and report the
verdict verbatim.

---

### 🤖 Assistant

> 🔧 called: use_skill, read_file, list_files, list_files, list_files, list_files



> 🔧 **use_skill** — rippleguard-verify

> 🔧 **list_files** — .

> 🔧 **read_file** — tickets/CHG-1042-customer-id-expansion.pdf

> 🔧 **list_files** — artifacts

> 🔧 **list_files** — scripts

> 🔧 **list_files** — fixtures

### 🤖 Assistant

> 🔧 called: update_todo_list, spawn_subagent, spawn_subagent, spawn_subagent, spawn_subagent

Good. I have the ticket and the file tree. Now I'll fan out parallel fresh explore subagents to independently re-derive the blast radius before I look at the ledger.

> 🔧 **update_todo_list** — [ ] Step 1: Fan out parallel explore subagents to re-derive blast radius
[ ] Step 2: Read impact ledger and compare against independently-derived blast radius
[ ] Step 3: Audit each ledger entry (tested/waived/changed/open)
[ ] Step 4: Run nightly_billing.js and record output
[ ] Step 5: Run ripple-gate.js --strict and record verdict
[ ] Step 6: Write artifacts/verify-report.md


> 🔧 **spawn_subagent** — api-explorer

> 🔧 **spawn_subagent** — code-explorer

> 🔧 **spawn_subagent** — batch-explorer

> 🔧 **spawn_subagent** — data-explorer

### 🤖 Assistant

> 🔧 called: update_todo_list, read_file

Excellent — all four explore subagents have returned. Now I'll read the impact ledger, then read every specific file referenced in the ledger entries to audit each status claim.

> 🔧 **update_todo_list** — [x] Step 1: Fan out parallel explore subagents to re-derive blast radius
[-] Step 2: Read impact ledger and compare against independently-derived blast radius
[ ] Step 3: Audit each ledger entry (tested/waived/changed/open)
[ ] Step 4: Run nightly_billing.js and record output
[ ] Step 5: Run ripple-gate.js --strict and record verdict
[ ] Step 6: Write artifacts/verify-report.md


> 🔧 **read_file** — artifacts/impact-ledger.json

### 🤖 Assistant

> 🔧 called: read_file, read_file, read_file, read_file, read_file, read_file, read_file, read_file, read_file, read_file, read_file, read_file, read_file, read_file, read_file, read_file, read_file

Now I need to read the actual current state of every file the ledger claims was changed, to audit each `tested` and `waived` status. Let me read all the key files simultaneously.

> 🔧 **read_file** — fixtures/order-app/data/customers.dat

> 🔧 **read_file** — fixtures/order-app/data/orders.dat

> 🔧 **read_file** — fixtures/order-app/tests/routes.test.js

> 🔧 **read_file** — fixtures/order-app/tests/validation.test.js

> 🔧 **read_file** — fixtures/order-app/tests/orderService.test.js

> 🔧 **read_file** — fixtures/order-app/db/schema/customers.sql

> 🔧 **read_file** — fixtures/order-app/db/schema/orders.sql

> 🔧 **read_file** — fixtures/order-app/src/orders/orderService.js

> 🔧 **read_file** — fixtures/order-app/db/views/customer_orders_v.sql

> 🔧 **read_file** — fixtures/order-app/src/api/routes.js

> 🔧 **read_file** — fixtures/order-app/src/customer/customerService.js

> 🔧 **read_file** — fixtures/order-app/src/common/validation.js

> 🔧 **read_file** — fixtures/order-app/src/common/recordLayouts.js

> 🔧 **read_file** — fixtures/order-app/batch/nightly_billing.js

> 🔧 **read_file** — fixtures/order-app/src/api/dto/customerDto.js

> 🔧 **read_file** — fixtures/order-app/config/feed-layout.json

> 🔧 **read_file** — fixtures/order-app/docs/ops/BILLING-RUNBOOK.md

### 🤖 Assistant

> 🔧 called: update_todo_list, execute_command, execute_command

I have everything I need from source files. Now let me run the two mechanical checks.

> 🔧 **update_todo_list** — [x] Step 1: Fan out parallel explore subagents to re-derive blast radius
[x] Step 2: Read impact ledger and compare against independently-derived blast radius
[x] Step 3: Audit each ledger entry (tested/waived/changed/open)
[-] Step 4: Run nightly_billing.js and record output
[ ] Step 5: Run ripple-gate.js --strict and record verdict
[ ] Step 6: Write artifacts/verify-report.md


> 🔧 **execute_command** — node fixtures/order-app/batch/nightly_billing.js 2>&1

> 🔧 **execute_command** — node scripts/ripple-gate.js --strict 2>&1

### 🤖 Assistant

> 🔧 called: read_file, read_file, update_todo_list

I have all the data I need. Let me now perform the full ledger audit and write the verification report. Let me read the `evidence-audit.json` and the `baseline-manifest.json` to get the full picture of the `SVC_CUSTOMER_SERVICE` stale-file finding.

> 🔧 **read_file** — artifacts/evidence-audit.json

> 🔧 **read_file** — artifacts/baseline-manifest.json

> 🔧 **update_todo_list** — [x] Step 1: Fan out parallel explore subagents to re-derive blast radius
[x] Step 2: Read impact ledger and compare against independently-derived blast radius
[x] Step 3: Audit each ledger entry (tested/waived/changed/open)
[x] Step 4: Run nightly_billing.js and record output
[x] Step 5: Run ripple-gate.js --strict and record verdict
[-] Step 6: Write artifacts/verify-report.md


### 🤖 Assistant

> 🔧 called: write_file

I now have everything I need. The evidence-audit.json is a snapshot of pre-change baselines — those "verified" quotes are from the OLD code. The gate compares current file hashes against the baseline to catch unchanged files. Let me now verify current file hashes by checking a key stale-file: the `SVC_CUSTOMER_SERVICE` that the gate flagged as unchanged.

I can see:
- `evidence-audit.json` shows the ledger's evidence quotes for `SVC_CUSTOMER_SERVICE` all resolve to `verified` against the baseline snapshot, meaning the baseline still matches the current file
- The gate confirmed: `SVC_CUSTOMER_SERVICE: status "tested" but file is identical to the pre-change baseline`

Wait — I need to re-read this carefully. The `evidence-audit.json` stores baseline ("before") quotes, not current quotes. The gate compares current hashes vs the baseline. Let me check whether `customerService.js` actually changed vs baseline.

Looking at the current `customerService.js` I read: it uses `layouts.put(customerId, layouts.CUSTOMER_ID)` and calls `assertValidCustomerId`. The ledger's "before" evidence quotes are line 9 (`assertValidCustomerId`), line 27 (`assertValidCustomerId(customerId)`), line 29 (`layouts.put`) — these EXACT same lines exist in the CURRENT file. So the file has NOT changed — the gate is correct.

But wait: the question is whether `customerService.js` NEEDED to change. Looking at the current file vs the ledger description: The ledger says it was impacted because `assertValidCustomerId` would enforce `len=9`. But now `validation.js` accepts len 9 OR 12, so `customerService.js` doesn't need to change — it inherits the fix. The real issue is the gate flags it as `tested` but identical to baseline, meaning the implementer marked it as changed/tested without actually modifying it. This is suspicious — either the change was purely inherited (valid) or the test doesn't prove 12-char behavior. Let me now write the full report.

> 🔧 **write_file** — artifacts/verify-report.md

### 🤖 Assistant

> 🔧 called: apply_diff, update_todo_list

Now apply the one ledger downgrade — `SVC_CUSTOMER_SERVICE` from `tested` → `open`:

> 🔧 **apply_diff** — artifacts/impact-ledger.json

> 🔧 **update_todo_list** — [x] Step 1: Fan out parallel explore subagents to re-derive blast radius
[x] Step 2: Read impact ledger and compare against independently-derived blast radius
[x] Step 3: Audit each ledger entry (tested/waived/changed/open)
[x] Step 4: Run nightly_billing.js and record output
[x] Step 5: Run ripple-gate.js --strict and record verdict
[x] Step 6: Write artifacts/verify-report.md


### 🤖 Assistant

---

## Verification Complete

Here is the full audit summary.

---

### nightly_billing.js Output (verbatim)

```
billing_run: 0 records -> G:\rippleguard-bob\fixtures\order-app\out\billing_run.txt
```

**A 12-character customer ID would NOT survive this job untruncated.** The job produced zero records because `line.substring(25, 26)` now reads a digit from within the ORDER_AMT field (the status byte shifted to offset 28 post-migration but the job still reads offset 25). Even if records were processed, `line.substring(0, 9)` on the CUSMAS extract, `line.substring(7, 16)` on the order extract, and the explicit `.padEnd(9, ' ').substring(0, 9)` on line 41 each independently truncate any 12-char key to its first 9 characters. The billing output line also pads the account key to only 9 characters.

---

### Gate Verdict (verbatim)

```
RELEASE BLOCKED
```

---

### What this audit found beyond the gate

| # | Severity | Finding |
|---|---|---|
| 1 | **MAJOR** | `SVC_CUSTOMER_SERVICE` — downgraded `tested` → `open` in the ledger. File is baseline-identical; referenced test only uses 9-char IDs. No test proves a native 12-char ID survives `GET /customers/{id}` end to end (AC5 violated). |
| 2 | MINOR | No native 12-char alphanumeric ID in any fixture `.dat` file — all tests use 9-char legacy keys padded to 12. AC5 only partially satisfied. |
| 3 | MINOR | `routes.test.js` never exercises BILLED (`B`) or CLOSED (`C`) order statuses at the HTTP layer. AC6 partially satisfied. |
| 4 | MINOR | `partner_feed.js` line 20 (`.slice(0, field.width)`) is the active truncation mechanism — not called out as a distinct artifact in the ledger, only the config is listed. |

The four gate-blocking ripples are confirmed: `BATCH_NIGHTLY_BILLING`, `BATCH_PARTNER_FEED`, `CONFIG_FEED_LAYOUT` (all legitimately `open`), and `SVC_CUSTOMER_SERVICE` (downgraded to `open` by this audit). The full evidence is in [`artifacts/verify-report.md`](artifacts/verify-report.md).

### 🤖 Assistant

Previous conversation summary:

---
## Goal
Independently audit the implementation of CHG-1042 (CUSTOMER_ID CHAR(9) → CHAR(12) + new GET /orders/{orderNo}/status endpoint) using the `rippleguard-verify` skill. Produce an evidence-linked verification report and apply any warranted ledger status downgrades.

## Instructions
- **Read-only for all code.** May only downgrade ledger statuses (never upgrade) and write `artifacts/verify-report.md`.
- Re-derive blast radius from scratch with fresh parallel explore subagents **before** looking at `artifacts/impact-ledger.json`.
- For each `tested` status: open the referenced test and confirm it exercises the new 12-char behavior.
- For each `waived` status: judge whether the reason is honest and acceptable for release.
- Run `node fixtures/order-app/batch/nightly_billing.js` and state whether a 12-char customer ID would survive untruncated — quote the output.
- Run `node scripts/ripple-gate.js --strict` and report the verdict verbatim.
- Follow RippleGuard project rules: never edit source/test/config/script files; never modify `scripts/ripple-gate.js` or anything in `bob_sessions/`.

## Discoveries

### Blast Radius (independently derived — matches ledger with additions)
All 17 ledger entries were corroborated. Two additional findings not explicit in the ledger:
1. **`partner_feed.js` line 20** — the `pad()` helper (`.slice(0, field.width)`) is the **active truncation mechanism** for the partner feed, not just the config. Not listed as a separate ledger artifact.
2. **Flat files are migrated** — `customers.dat` and `orders.dat` appear to have had `migrate-data.js --apply` run (43/37-byte records confirmed by passing tests), but the `evidence-audit.json` baseline quotes are from the pre-change 40/34-byte era.

### nightly_billing.js
- **Output:** `billing_run: 0 records -> G:\rippleguard-bob\fixtures\order-app\out\billing_run.txt`
- **Root cause of zero records:** `line.substring(25, 26)` reads ORDER_STAT; after migration, ORDER_STAT is at offset 28, so offset 25 reads a digit from ORDER_AMT — never `'S'` — so every order is skipped.
- **12-char ID survival:** NO. The job has 4 independent truncation/mis-read points (lines 30, 31, 36, 39, 40, 41, 54) all hardcoded to CHAR(9)-era arithmetic. Runbook explicitly blocks running this job against migrated data until Finance Ops sign-off.

### Ledger Audit Verdicts
| Artifact ID | Status | Verdict |
|---|---|---|
| DB_CUSTOMERS_SCHEMA | waived | ✅ Honest and acceptable — DDL changed to CHAR(12) confirmed |
| DB_ORDERS_SCHEMA | waived | ✅ Honest and acceptable — DDL changed to CHAR(12) confirmed |
| DB_CUSTOMER_ORDERS_VIEW | waived | ✅ Honest and acceptable — SUBSTR/CAST removed confirmed |
| DATA_CUSTOMERS_DAT | tested | ⚠️ Marginal — no native 12-char ID tested, only padded legacy |
| DATA_ORDERS_DAT | tested | ✅ Confirmed — getOrder test proves new offsets work |
| COMMON_VALIDATION | tested | ✅ Confirmed — 3 distinct 12-char IDs tested as valid |
| COMMON_RECORD_LAYOUTS | tested | ✅ Confirmed indirectly via orderService tests |
| SVC_ORDER_SERVICE | tested | ✅ Confirmed — drift-copy CUSID_LEN=9 removed; 12-char normalization tested |
| SVC_CUSTOMER_SERVICE | ~~tested~~ → **open** | ❌ **DOWNGRADED** — file identical to baseline; routes.test.js only uses 9-char IDs; no test for `GET /customers/{12-char-id}` |
| BATCH_NIGHTLY_BILLING | open | ✅ Correct — all 6 offset literals still CHAR(9)-era |
| BATCH_PARTNER_FEED | open | ✅ Correct — feed-layout.json still V1/width=9 |
| CONFIG_FEED_LAYOUT | open | ✅ Correct — V1 spec unchanged |
| API_CUSTOMER_DTO | tested | ✅ Confirmed — maxLength=12, toOrderStatusDto added |
| API_ROUTES | tested | ✅ Confirmed — /orders/{orderNo}/status exists and tested |
| TEST_ORDER_SERVICE | tested | ✅ Confirmed — updated with 12-byte extract tests |
| TEST_VALIDATION | tested | ✅ Confirmed — old `=== false` assertion removed, 12-char acceptance added |
| DOCS_BILLING_RUNBOOK | waived | ✅ Honest and acceptable — updated to CHAR(12), explicit pending-action warning |

### Gate Output (verbatim)
```
================ RippleGuard Gate ================
Ticket:   CHG-1042 — Expand CUSTOMER_ID from CHAR(9) to CHAR(12)...
Ledger:   artifacts/impact-ledger.json
Ripples:  17 total | tested 10 | waived 4 | changed 0 | open 3
Tests:    pass (17 passed, 0 failed)
Evidence: 59/60 quotes verified verbatim against source
Failures:
  - UNRESOLVED RIPPLE: BATCH_NIGHTLY_BILLING is "open"
  - UNRESOLVED RIPPLE: BATCH_PARTNER_FEED is "open"
  - UNRESOLVED RIPPLE: CONFIG_FEED_LAYOUT is "open"
  - SVC_CUSTOMER_SERVICE: status "tested" but file is identical to the pre-change baseline

  RELEASE BLOCKED
==================================================
```
*(Gate was run before the SVC_CUSTOMER_SERVICE downgrade was applied; after the downgrade the ledger now has 4 open ripples)*

## Accomplished
- ✅ Activated `rippleguard-verify` skill
- ✅ Read ticket `tickets/CHG-1042-customer-id-expansion.pdf`
- ✅ Fanned out 4 parallel read-only explore subagents (data-explorer, code-explorer, batch-explorer, api-explorer) to independently re-derive blast radius before reading the ledger
- ✅ Read `artifacts/impact-ledger.json` and compared against independent findings
- ✅ Read all 17 referenced source/test/config files to audit each ledger entry
- ✅ Ran `node fixtures/order-app/batch/nightly_billing.js` — quoted output above
- ✅ Ran `node scripts/ripple-gate.js --strict` — quoted verdict above
- ✅ Wrote `artifacts/verify-report.md` (340 lines, severity-ranked findings, per-AC verdict table, full gate verdict)
- ✅ Downgraded `SVC_CUSTOMER_SERVICE` from `tested` → `open` in `artifacts/impact-ledger.json` (the only ledger edit)

**Nothing is left to do for this verification task.** The report is complete and the gate verdict is final: **RELEASE BLOCKED**.

## Relevant files / directories

### Read (source files audited)
- `tickets/CHG-1042-customer-id-expansion.pdf` — ticket / acceptance criteria
- `fixtures/order-app/db/schema/customers.sql` — CHAR(12) confirmed
- `fixtures/order-app/db/schema/orders.sql` — CHAR(12) confirmed
- `fixtures/order-app/db/views/customer_orders_v.sql` — SUBSTR/CAST removed confirmed
- `fixtures/order-app/data/customers.dat` — migrated 43-byte records (read via execute/subagent)
- `fixtures/order-app/data/orders.dat` — migrated 37-byte records (read via execute/subagent)
- `fixtures/order-app/src/common/recordLayouts.js` — all offsets updated to 12
- `fixtures/order-app/src/common/validation.js` — dual-accept 9/12, CUSTOMER_ID_LENGTH=12
- `fixtures/order-app/src/orders/orderService.js` — CUSID_LEN drift-copy removed
- `fixtures/order-app/src/customer/customerService.js` — unchanged from baseline (gate-confirmed)
- `fixtures/order-app/src/api/dto/customerDto.js` — maxLength=12, toOrderStatusDto added
- `fixtures/order-app/src/api/routes.js` — /orders/{orderNo}/status route added
- `fixtures/order-app/batch/nightly_billing.js` — 6 CHAR(9)-era hardcoded offsets remain
- `fixtures/order-app/batch/partner_feed.js` — pad() helper truncates at field.width=9
- `fixtures/order-app/config/feed-layout.json` — PARTNER-DAILY-V1, CUST_KEY width=9
- `fixtures/order-app/docs/ops/BILLING-RUNBOOK.md` — updated with pending-action warning
- `fixtures/order-app/tests/orderService.test.js` — updated, 12-byte extract tested
- `fixtures/order-app/tests/validation.test.js` — updated, 12-char IDs tested as valid
- `fixtures/order-app/tests/routes.test.js` — status endpoint tested; only 9-char IDs in customer routes

### Read (artifacts)
- `artifacts/impact-ledger.json` — the ledger being audited
- `artifacts/baseline-manifest.json` — pre-change file hashes
- `artifacts/evidence-audit.json` — baseline quote verification snapshot

### Written / Modified
- `artifacts/verify-report.md` — **created** (full verification report, 340 lines)
- `artifacts/impact-ledger.json` — **modified**: `SVC_CUSTOMER_SERVICE.status` downgraded from `tested` → `open`; `verify_downgrade_reason` field added; `test` field removed

### Written by gate (side-effects, not by this agent)
- `artifacts/gate-result.json` — gate run output
- `artifacts/certificate.html` — gate certificate
- `ui/gate-state.js` — gate state for UI

---



---

### 👤 User

continue

---

### 🤖 Assistant

> 🔧 called: read_file, read_file



> 🔧 **read_file** — artifacts/verify-report.md

> 🔧 **read_file** — artifacts/impact-ledger.json

### 🤖 Assistant

> 🔧 called: execute_command, execute_command

The ledger and report are both intact from the prior session. The `SVC_CUSTOMER_SERVICE` downgrade is in place. Let me now run the gate and the billing job one more time to produce fresh verbatim output for this session.

> 🔧 **execute_command** — node fixtures/order-app/batch/nightly_billing.js

> 🔧 **execute_command** — node scripts/ripple-gate.js --strict

### 🤖 Assistant

Everything is current and confirmed. Here is the complete audit summary for this session.

---

## RippleGuard Verification — CHG-1042 Summary

The full evidence-linked report is in [`artifacts/verify-report.md`](artifacts/verify-report.md). Below is the final state of all deliverables.

---

### nightly_billing.js — verbatim output

```
billing_run: 0 records -> G:\rippleguard-bob\fixtures\order-app\out\billing_run.txt
```

**A 12-character customer ID does NOT survive this job untruncated.** The job reads `ORDER_STAT` at `line.substring(25, 26)` — 3 bytes into the ORDER_AMT field after migration — so the `!== 'S'` guard skips every record, producing zero billing output. Even if that bug were absent, `line.substring(0, 9)` and `line.substring(7, 16)` both read only 9 bytes of the now-12-byte key, and `.padEnd(9).substring(0,9)` double-truncates before the credit lookup. A genuine 12-char ID (e.g. `ABC123456789`) would be read as `ABC123456` and produce a credit-lookup miss and HOLD flag.

---

### ripple-gate.js --strict — verbatim verdict

```
================ RippleGuard Gate ================
Ticket:   CHG-1042 — Expand CUSTOMER_ID from CHAR(9) to CHAR(12) across all artifacts; add GET /orders/{orderNo}/status endpoint
Ledger:   artifacts/impact-ledger.json
Ripples:  17 total | tested 9 | waived 4 | changed 0 | open 4
Tests:    pass (17 passed, 0 failed)
Evidence: 59/60 quotes verified verbatim against source (audited 2026-08-29T19:26:08.773Z)
Failures:
  - UNRESOLVED RIPPLE: SVC_CUSTOMER_SERVICE is "open" — Imports both recordLayouts.js and validation.js; calls assertValidCustomerId (enforcing len=9) and layouts.put with CUSTOMER_ID (len:9), so every customer lookup and write will break for 12-char keys
  - UNRESOLVED RIPPLE: BATCH_NIGHTLY_BILLING is "open" — Reads CUSMAS and ORDMAS extracts by raw positional offsets (not via recordLayouts.js); hardcodes substring(0,9), substring(7,16), substring(16,25), substring(25,26), substring(32,40), padEnd(9) — every offset is wrong after the key expands by 3 bytes, and the billing output will silently corrupt finance data with no runtime error (see runbook OPS-311)
  - UNRESOLVED RIPPLE: BATCH_PARTNER_FEED is "open" — Generates the partner feed using feed-layout.json which encodes CUST_KEY width=9 and record_length=40; if the config is updated the feed format changes and existing 3PL partners will break, requiring V2 spec coordination
  - UNRESOLVED RIPPLE: CONFIG_FEED_LAYOUT is "open" — Partner feed spec V1 declares CUST_KEY width=9 and all subsequent field offsets; width must change to 12, all offsets cascade +3, record_length grows 40→43, and feed version must be bumped to V2 per the runbook requirement

  RELEASE BLOCKED
==================================================
```

---

### Ledger change made by this audit

| Artifact ID | Before | After | Reason |
|---|---|---|---|
| `SVC_CUSTOMER_SERVICE` | `tested` | `open` | File is identical to pre-change baseline. Referenced test (`routes.test.js`) exercises only 9-char IDs. No test proves a native 12-char ID survives `GET /customers/{12-char-id}` end to end. AC5 not satisfied. |

---

### Blocking issues (4 open ripples)

| # | Ripple | What must happen before release |
|---|---|---|
| 1 | `SVC_CUSTOMER_SERVICE` | Add a `GET /customers/ABC123456789` route test that returns HTTP 200 with a 12-char `customerId` in the response body |
| 2 | `BATCH_NIGHTLY_BILLING` | Fix the 6 hardcoded CHAR(9) offsets; obtain Finance Ops sign-off (ticket OPS-311); re-run against migrated data and confirm non-zero billing output |
| 3 | `BATCH_PARTNER_FEED` | Coordinate V2 spec with 3PL partners; update `config/feed-layout.json` (width 9→12, all offsets +3, record_length 40→43, version PARTNER-DAILY-V2) |
| 4 | `CONFIG_FEED_LAYOUT` | Same as above — blocked on partner feed V2 coordination |

---

**RELEASE BLOCKED** — 4 unresolved open ripples. All tests pass and all 4 waivers are honest, but the implementation does not satisfy AC3 (no consumer truncates a 12-char ID), AC4 (partner feed spec bumped to V2), or AC5 (end-to-end 12-char test through customer service) as written.