# Ground truth — the seeded blast radius for CHG-1042

Machine-readable version: [`ground-truth.json`](ground-truth.json). The gate
and `scripts/baseline-grep.js` score against it, so every recall number in
the demo is reproducible by judges.

Change: expand `CUSTOMER_ID` CHAR(9) → CHAR(12) + add
`GET /orders/{orderNo}/status`.

## The 15 impacted artifacts

| # | Artifact | Domain | Why | Grep finds it? |
|---|---|---|---|---|
| 1 | `db/schema/customers.sql` | database | `CUSTOMER_ID CHAR(9)` + format CHECK | Yes |
| 2 | `db/schema/orders.sql` | database | FK `CUSTOMER_ID CHAR(9)` | Yes |
| 3 | `db/views/customer_orders_v.sql` | database | `SUBSTR(CUSTOMER_ID,1,9)` + `CHAR(9)` cast | Yes |
| 4 | `src/common/recordLayouts.js` | code | master layout width 9; downstream offsets shift | Yes |
| 5 | `src/common/validation.js` | code | `CUSTOMER_ID_LENGTH = 9` + 9-char regex | Yes |
| 6 | `src/customer/customerService.js` | code | normalizes keys to the field width | Yes |
| 7 | `src/orders/orderService.js` | code | **TRAP** — drift copy `CUSID_LEN = 9`, pad-and-slice truncation | **No** |
| 8 | `src/api/dto/customerDto.js` | api | wire contract `maxLength: 9` + pattern | Yes |
| 9 | `src/api/routes.js` | api | 9-char validation on every route; R2 endpoint lands here | Yes |
| 10 | `batch/nightly_billing.js` | batch | **TRAP** — anonymous offsets `substring(0,9)`, `substring(7,16)`, `substring(32,40)`; documented only in the ops runbook | **No** |
| 11 | `batch/partner_feed.js` | batch | emits fixed-width `CUST_KEY` at contractual width | Yes |
| 12 | `config/feed-layout.json` | config | **TRAP** — spec pins `CUST_KEY` width 9, `record_length` 40 | **No** |
| 13 | `tests/validation.test.js` | test | asserts 9 valid / 12 invalid — flips with the change | Yes |
| 14 | `tests/orderService.test.js` | test | fixtures assume 9-char keys | Yes |
| 15 | `docs/ops/BILLING-RUNBOOK.md` | docs | documents the CHAR(9) contract and hand-maintained offsets | Yes |

(Paths relative to `fixtures/order-app/`.)

## Why the traps are fair (not adversarial noise)

Each trap is a pattern that genuinely occurs in legacy systems and defeats
name-based search for a well-understood reason:

- **Alias drift** (`CUSID_LEN`): teams shorten names in older modules and
  the constants stop tracking the master definition.
- **Positional consumers** (`nightly_billing.js`): jobs ported from
  RPG/CL-era code read fixed-width records by byte position; the field name
  never appears. The only breadcrumb is operational documentation — which
  is exactly what Bob's document understanding is for.
- **Contractual specs** (`feed-layout.json`): external interface widths live
  under partner-facing names, not internal ones.

## Demo choreography

`nightly_billing.js` is intentionally the LAST artifact resolved: the
implement phase is scoped to exclude `batch/` ("needs Finance Ops
sign-off"), so the gate blocks — the red moment. Task 4 grants sign-off,
Bob fixes the job with a regression test, and the gate flips green.

## Rules of integrity

- Bob's analyze phase must discover these artifacts itself. Never paste
  this file, `ground-truth.json`, or artifact lists into a Bob prompt.
- If Bob misses one, report the real recall number and improve the persona
  files — do not hand-edit Bob's ledger to fake 15/15.
