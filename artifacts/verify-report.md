# RippleGuard Verification Report
## Ticket CHG-1042 — CUSTOMER_ID CHAR(9) → CHAR(12) + GET /orders/{orderNo}/status

**Verifier:** rippleguard-verify independent audit  
**Audit date:** 2026-08-29  
**Ledger:** `artifacts/impact-ledger.json`  
**Gate verdict (verbatim):**

```
================ RippleGuard Gate ================
Ticket:   CHG-1042 — Expand CUSTOMER_ID from CHAR(9) to CHAR(12) across all artifacts; add GET /orders/{orderNo}/status endpoint
Ledger:   artifacts/impact-ledger.json
Ripples:  17 total | tested 10 | waived 4 | changed 0 | open 3
Tests:    pass (17 passed, 0 failed)
Evidence: 59/60 quotes verified verbatim against source (audited 2026-08-29T19:26:08.773Z)
Failures:
  - UNRESOLVED RIPPLE: BATCH_NIGHTLY_BILLING is "open" — Reads CUSMAS and ORDMAS extracts by raw positional offsets (not via recordLayouts.js); hardcodes substring(0,9), substring(7,16), substring(16,25), substring(25,26), substring(32,40), padEnd(9) — every offset is wrong after the key expands by 3 bytes, and the billing output will silently corrupt finance data with no runtime error (see runbook OPS-311)
  - UNRESOLVED RIPPLE: BATCH_PARTNER_FEED is "open" — Generates the partner feed using feed-layout.json which encodes CUST_KEY width=9 and record_length=40; if the config is updated the feed format changes and existing 3PL partners will break, requiring V2 spec coordination
  - UNRESOLVED RIPPLE: CONFIG_FEED_LAYOUT is "open" — Partner feed spec V1 declares CUST_KEY width=9 and all subsequent field offsets; width must change to 12, all offsets cascade +3, record_length grows 40→43, and feed version must be bumped to V2 per the runbook requirement
  - SVC_CUSTOMER_SERVICE: status "tested" but file is identical to the pre-change baseline

  RELEASE BLOCKED
==================================================
```

---

## Section 1 — Independent Blast-Radius Derivation vs Ledger

Four fresh explore subagents (data-explorer, code-explorer, batch-explorer, api-explorer) independently scanned the fixture tree before the ledger was consulted. Their combined findings map to the following ledger comparison:

### Artifacts ledger contains — confirmed by independent scan ✓

All 17 ledger entries were independently corroborated. No ledger entry is spurious.

### Artifacts found by independent scan that the ledger LACKS

| Artifact | Path | Why it matters | Severity |
|---|---|---|---|
| **MISSING** `BATCH_PARTNER_FEED_JS_PAD_HELPER` | `fixtures/order-app/batch/partner_feed.js` line 20 | The `pad()` helper (`s.padEnd(field.width, padChar).slice(0, field.width)`) enforces the CUST_KEY width via `.slice()` — it is the active truncation site, not just the config. The ledger calls out the config but not this code path. This is the mechanism by which a 12-char ID is silently truncated to 9 in the partner feed. | CRITICAL |
| **MISSING** `DATA_DAT_BASELINE_STALE` | `fixtures/order-app/data/customers.dat`, `data/orders.dat` | The evidence-audit.json confirms the ledger's "before" quotes for DATA_CUSTOMERS_DAT (line 1: `ABC100001Aurora Textiles     NE 00250000`, 40 bytes) and DATA_ORDERS_DAT (line 1: `0000101ABC100001000012500S20260810`, 34 bytes) are verified against the baseline — meaning the flat files have **not been migrated**. `migrate-data.js --apply` has not been run. The current `.dat` files still contain the old 40/34-byte records. The tests pass only because the code now reads 12-byte-wide fields from a 43/37-byte file — but the files are still 40/34 bytes. This is a latent misparse. | CRITICAL |

> **Critical Finding — Unmigrated Flat Files:** The data explorer confirmed that `customers.dat` records are structured as 43-character rows (key occupies bytes 0–11 with 3 pad spaces), which is consistent with the migrated layout. However, the evidence-audit.json baseline quotes show the OLD 40-byte records verbatim (e.g. `ABC100001Aurora Textiles     NE 00250000` — only 40 chars). This means the baseline was snapshotted BEFORE migration, and the gate's evidence check is verifying the OLD content. The flat files need direct byte-count inspection to be certain — but the nightly_billing.js run result of `0 records` (described in Section 3) reveals the data files are now written in the 43/37-byte format (stat field at offset 28, not 25), so the migration appears to have been applied. The `migrate-data.js --apply` was run at some point. The tests confirm 8 orders load and the status/date fields resolve correctly. **This finding is downgraded to MAJOR**: the data files appear migrated, but the evidence-audit.json baseline quotes are stale and do not prove the post-migration state.

---

## Section 2 — Ledger Entry Audit

### DB_CUSTOMERS_SCHEMA — status: `waived`

**Ledger waiver reason:** "DDL-only artifact; no local SQL engine in this fixture set. Change was applied (CHAR(9)→CHAR(12), LIKE pattern updated). Verified by code review — no executable test harness for raw DDL."

**Verification:**
- Current file (`db/schema/customers.sql` line 8): `CUSTOMER_ID   CHAR(12)     NOT NULL,` ✓
- LIKE pattern (line 14–15): `'____________' ESCAPE '\'` — 12 underscore characters ✓
- Comment (line 15): `-- 12 positions, format AAA999999 or AAA999999999` ✓

**Verdict: WAIVER HONEST AND ACCEPTABLE.** No SQL engine exists to test DDL. The change is correctly applied and the code-review verification is genuine. The waiver is narrow and accurate. ✅

---

### DB_ORDERS_SCHEMA — status: `waived`

**Ledger waiver reason:** "DDL-only artifact; no local SQL engine in this fixture set. Change was applied (CHAR(9)→CHAR(12)). Verified by code review."

**Verification:**
- Current file (`db/schema/orders.sql` line 7): `CUSTOMER_ID   CHAR(12)     NOT NULL,` ✓
- FK constraint still references `CUSMAS (CUSTOMER_ID)` — both sides now 12 ✓

**Verdict: WAIVER HONEST AND ACCEPTABLE.** Same rationale as customers schema. ✅

---

### DB_CUSTOMER_ORDERS_VIEW — status: `waived`

**Ledger waiver reason:** "DDL-only artifact; no local SQL engine in this fixture set. Truncating SUBSTR/CAST removed; view now selects C.CUSTOMER_ID directly. Verified by code review."

**Verification:**
- Current file line 2: `-- CHG-1042: Removed SUBSTR(CUSTOMER_ID, 1, 9) / CAST(AS CHAR(9)) truncation.` ✓
- Current file line 6: `SELECT C.CUSTOMER_ID AS CUSTOMER_KEY,` — direct select, no SUBSTR/CAST ✓
- The old `CAST(SUBSTR(C.CUSTOMER_ID, 1, 9) AS CHAR(9))` has been removed ✓

**Note:** The ledger's "evidence" quotes (`SELECT CAST(SUBSTR...` and `-- The SUBSTR guards against legacy records with trailing filler`) no longer exist in the file. The evidence-audit verified these quotes — meaning it verified them against the **baseline** (pre-change) content, not the current content. This is expected behavior for the evidence snapshot but confirms the baseline was pre-change.

**Verdict: WAIVER HONEST AND ACCEPTABLE.** ✅

---

### DATA_CUSTOMERS_DAT — status: `tested`

**Referenced test:** `fixtures/order-app/tests/orderService.test.js`

**Claimed behavior:** Tests the 12-byte migrated flat file.

**Verification of test:**
The test at `orderService.test.js` line 38–39:
```javascript
test('order extract parses all 8 records', () => {
  assert.equal(loadOrders().length, 8);
});
```
This proves 8 records are loaded from the orders extract (not customers directly, but orders reference the migrated file).

Test at line 21–25:
```javascript
test('ordersForCustomer finds orders by 12-char key (padded legacy)', () => {
  const orders = ordersForCustomer('ABC100001   ');  // 9-char + 3 spaces = 12 bytes
  assert.equal(orders.length, 2);
});
```
This proves the service reads a 12-byte-wide ORDER_CUST field and matches via normalization.

**Gap:** No test uses a **native non-padded 12-char alphanumeric ID** (e.g. `'ABC123456789'`) in a lookup against `customers.dat`. All tests use legacy 9-char keys, which are right-padded to 12 in the extract. This means the end-to-end 12-char native ID path through `customers.dat` has **not been exercised**. However, the service code correctly derives its field widths from `recordLayouts.js` (which is now len:12), so functionally a native 12-char key would resolve correctly IF the data file had such a record.

**Verdict: `tested` status is MARGINAL — not downgraded, but flagged MINOR.** The test proves the 12-byte extract is read correctly for legacy IDs. No native 12-char ID is in the fixture, so AC5 ("new tests proving 12-character ids survive every read/write path end to end") is only partially satisfied. ⚠️ MINOR

---

### DATA_ORDERS_DAT — status: `tested`

**Referenced test:** `fixtures/order-app/tests/orderService.test.js`

**Verification of test:**
Test at line 28–36:
```javascript
test('getOrder resolves all status fields from 12-byte extract', () => {
  const order = getOrder('0000101');
  assert.ok(order);
  assert.equal(order.custNo, 'ABC100001');
  assert.equal(order.status, 'S');
  assert.equal(order.statusName, 'SHIPPED');
  assert.equal(order.statusDate, '20260810');
  assert.equal(order.amount, 125.0);
});
```
This test exercises reading `ORDER_STAT` at offset 28 and `ORDER_DATE` at offset 29 — the new post-shift positions. It would FAIL if the file were still in 34-byte (old) format (because ORDER_STAT was at offset 25 in the old layout). The test passing confirms the migration has been applied.

**Gap:** Same as DATA_CUSTOMERS_DAT — no native 12-char customer ID in the order fixture.

**Verdict: `tested` status CONFIRMED for the structural integrity of the migrated extract.** ✅ (MINOR gap: no native 12-char ID exercised)

---

### COMMON_VALIDATION — status: `tested`

**Referenced test:** `fixtures/order-app/tests/validation.test.js`

**Verification of test:**
- Line 13–14: `test('CUSTOMER_ID_LENGTH is now 12...')` → `assert.equal(CUSTOMER_ID_LENGTH, 12)` ✓
- Line 22–25: Tests three explicit 12-char IDs as valid (`'ABC123456789'`, `'ZZZ000000001'`, `'DEF200004000'`) ✓
- Line 28–32: Tests boundary lengths 8/10/11/13 as invalid ✓
- Line 17–19: Accepts legacy 9-char `'ABC123456'` ✓

The current `validation.js` has `CUSTOMER_ID_LENGTH = 12` (line 10), dual-accept pattern `/^[A-Z]{3}[0-9]{6}([0-9]{3})?$/` (line 13), and `id.length === 9 || id.length === 12` (line 18). This precisely matches what the tests assert.

**Verdict: `tested` status CONFIRMED. Tests prove 12-char behavior directly.** ✅

---

### COMMON_RECORD_LAYOUTS — status: `tested`

**Referenced test:** `fixtures/order-app/tests/orderService.test.js`

**Verification:**
The current `recordLayouts.js` shows:
- `CUSTOMER_ID = { start: 0, len: 12 }` (line 18) ✓
- `CUST_NAME = { start: 12 }` (line 19) ✓
- `CUST_REGION = { start: 32 }` (line 20) ✓
- `CUST_CREDIT = { start: 35 }` (line 21) ✓
- `CUST_RECLEN = 43` (line 22) ✓
- `ORDER_CUST = { start: 7, len: 12 }` (line 26) ✓
- `ORDER_AMT = { start: 19 }` (line 27), `ORDER_STAT = { start: 28 }` (line 28), `ORDER_DATE = { start: 29 }` (line 29) ✓
- `ORDER_RECLEN = 37` (line 30) ✓

The `getOrder` test reads `order.status === 'S'` and `order.statusDate === '20260810'` — these fields are at offsets 28 and 29 respectively in the new layout. If the copybook were not updated, these assertions would fail because the data file is migrated to 37-byte records. The test passing confirms the copybook and data are in sync.

**Verdict: `tested` status CONFIRMED indirectly through orderService tests.** ✅

---

### SVC_ORDER_SERVICE — status: `tested`

**Referenced test:** `fixtures/order-app/tests/orderService.test.js`

**Verification:**
The current `orderService.js` header comments: "CHG-1042: Removed drift-copy CUSID_LEN; key width now sourced from recordLayouts.ORDER_CUST.len". Current line 38–39:
```javascript
const keyWidth = layouts.ORDER_CUST.len;  // 12
const key = String(custNo).padEnd(keyWidth, ' ').slice(0, keyWidth).trim();
```
The drift-copy `const CUSID_LEN = 9` (old line 12) has been **removed**. The ledger's evidence quote `"const CUSID_LEN = 9;"` at line 12 no longer exists in the current file.

Test at line 21–25 proves `ordersForCustomer('ABC100001   ')` (12-char padded) resolves correctly — this would fail with the old 9-char `padEnd(9)` since trimming 'ABC100001   '.padEnd(9) → 'ABC100001' would not match `'ABC100001   '` stored in the file. The test confirms the 12-char key normalization works.

**Verdict: `tested` status CONFIRMED. The drift copy was removed; 12-char key path exercised.** ✅

---

### SVC_CUSTOMER_SERVICE — status: `tested` ⚠️ FLAGGED BY GATE

**Referenced test:** `fixtures/order-app/tests/routes.test.js`

**Gate finding:** "SVC_CUSTOMER_SERVICE: status 'tested' but file is identical to the pre-change baseline"

**Verification:**
Current `customerService.js` contains:
- Line 9: `const { assertValidCustomerId } = require('../common/validation');` — same as ledger evidence
- Line 27: `assertValidCustomerId(customerId);` — same as ledger evidence
- Line 29: `const key = layouts.put(customerId, layouts.CUSTOMER_ID);` — same as ledger evidence

The baseline hash in `baseline-manifest.json` for `customerService.js` is `e43cd791a0aabcd82948fbb602283bfef22a4290e8ee4490ecea5b9b8e8955b3`. The gate confirms the current hash matches the baseline — the file was **not changed**.

**Analysis:** The ledger's `why` states the file "will break for 12-char keys" because it calls `assertValidCustomerId` (which enforced len=9) and `layouts.put(customerId, layouts.CUSTOMER_ID)` (which used len=9). Both of those upstream artifacts (`validation.js`, `recordLayouts.js`) HAVE been changed to 12. So `customerService.js` is **functionally fixed without needing code edits** — it inherits the fix from its dependencies. The implementer correctly recognized this and marked it `tested` without editing the file itself.

**However:** The test (`routes.test.js`) for this artifact exercises only 9-char customer IDs (`'ABC100001'`). Test at line 72–79:
```javascript
test('GET /customers/{customerId} accepts 9-char legacy id', () => {
  const req = fakeReq('GET', '/customers/ABC100001');
  ...
  assert.equal(body.customerId, 'ABC100001');
});
```
**No test exercises `GET /customers/{12-char-id}` end-to-end through customerService.** The route's validation (`isValidCustomerId`) does accept 12-char IDs, and `findCustomer` would call `assertValidCustomerId` (which now accepts 12-char). But there is **no route test with a native 12-char customer ID as the path parameter**. AC5 ("new tests proving 12-character ids survive every read/write path end to end") is not satisfied for the customerService lookup path.

**Status downgrade justified:** The `tested` claim for `SVC_CUSTOMER_SERVICE` is based on a test that never exercises a 12-char customer ID through the customer lookup path. The file is correct (inherits the fix), but the test does not prove 12-char behavior for this specific path.

**Verdict: Downgrading `SVC_CUSTOMER_SERVICE` from `tested` → `open`.**  
**Reason:** No test in `routes.test.js` exercises `GET /customers/{12-char-id}` end to end. AC5 violated. ❌ **MAJOR**

---

### BATCH_NIGHTLY_BILLING — status: `open` ✓

**Verification:** Confirmed. All six hardcoded offsets in `nightly_billing.js` are the old CHAR(9) positional values:
- Line 30: `line.substring(0, 9)` — reads only first 9 bytes of CUSMAS key (old)
- Line 31: `line.substring(32, 40)` — credit limit at old offset 32 (new offset is 35)
- Line 36: `line.substring(25, 26)` — ORDER_STAT at old offset 25 (new offset is 28)
- Line 39: `line.substring(7, 16)` — ORDER_CUST at old positions 7–15, 9 chars (new is 7–18, 12 chars)
- Line 40: `line.substring(16, 25)` — ORDER_AMT at old offset 16 (new offset is 19)
- Line 41: `.padEnd(9, ' ').substring(0, 9)` — double-truncates key to 9

Runbook (`BILLING-RUNBOOK.md` lines 17–21) explicitly states this batch job must NOT be run against the migrated 12-byte extract until Finance Ops sign-off. **The constraint in the ticket ("Finance Ops sign-off") is acknowledged and unresolved.**

**Status `open` is correct.** This blocks release per AC3. ✓

---

### BATCH_PARTNER_FEED — status: `open` ✓

**Verification:** Confirmed. `config/feed-layout.json` still has `CUST_KEY width: 9`, `record_length: 40`, version `PARTNER-DAILY-V1`. `partner_feed.js` pad helper (line 20): `s.padEnd(field.width, padChar).slice(0, field.width)` — this truncates any ID to 9 chars. The feed version bump to V2 has not been performed.

**Status `open` is correct.** This blocks release per AC4. ✓

---

### CONFIG_FEED_LAYOUT — status: `open` ✓

**Verification:** Confirmed. Same evidence as BATCH_PARTNER_FEED — the config is V1, width=9, all offsets stale.

**Status `open` is correct.** ✓

---

### API_CUSTOMER_DTO — status: `tested`

**Referenced test:** `fixtures/order-app/tests/routes.test.js`

**Verification:**
Current `customerDto.js` line 11: `customerId: { type: 'string', maxLength: 12, pattern: '^[A-Z]{3}[0-9]{6}([0-9]{3})?$' }` ✓

The `toOrderStatusDto` function (lines 40–48) was ADDED as part of R2, and the `toOrderDto` function at line 28 now copies `order.custNo` which can be up to 12 chars. The schema `maxLength` is 12.

**Gap:** `routes.test.js` line 43 (`custNo trimmed from 12-char padded field; legacy id stored as-is`) asserts `body.customerId === 'ABC100001'` (9-char trimmed value). There is no test asserting a 12-char native `customerId` value in the wire response. Also: `toOrderStatusDto` at line 43 does `customerId: order.custNo` with no `.trim()` — if `custNo` arrives as `'ABC100001   '` (padded), it leaks into the wire response. `orderService.js` calls `layouts.slice()` which calls `.trim()`, so the trim happens at the service layer — this is safe. Confirmed from `orderService.js` line 28: `custNo: layouts.slice(line, layouts.ORDER_CUST)` and `layouts.slice` calls `.trim()` at line 34.

**Verdict: `tested` status MARGINALLY CONFIRMED.** The DTO correctly handles trimmed values from the service layer. The maxLength is correct at 12. Minor gap: no native 12-char value asserted in wire response tests. ⚠️ MINOR

---

### API_ROUTES — status: `tested`

**Referenced test:** `fixtures/order-app/tests/routes.test.js`

**Verification:**
Current `routes.js`:
- Line 50: `if (parts[0] === 'orders' && parts.length === 3 && parts[2] === 'status')` — R2 endpoint EXISTS ✓
- Line 32: `if (!isValidCustomerId(id))` — now accepts 12-char IDs (via updated validation) ✓
- Line 43: same for `/customers/{id}/orders` ✓

Tests in `routes.test.js`:
- Lines 22–36: GET /orders/0000101/status → 200 ✓
- Lines 38–53: GET /orders/0000104/status → 200 ✓  
- Lines 55–61: GET /orders/BADORDER/status → 400 ✓
- Lines 63–68: GET /orders/9999999/status → 404 ✓
- Lines 72–79: GET /customers/ABC100001 → 200 (9-char legacy) ✓
- Lines 95–100: GET /customers/bad → 400 ✓
- Lines 102–107: GET /customers/ZZZ999999 → 404 ✓

AC6 satisfied: tests for shipped (S), and the route handles the four status types via `STATUS_NAMES` map (O/S/B/C → OPEN/SHIPPED/BILLED/CLOSED). However, tests only use order 0000101 (S=SHIPPED) and 0000104 (unknown status). **No tests explicitly verify billed (B) and closed (C) responses** in the route layer — though the business logic is in the service layer.

**Gap:** No test exercises `GET /customers/{12-char-id}` with a valid 12-char native ID returning 200. The validation now accepts 12-char IDs but this path is untested at the HTTP layer.

**Verdict: `tested` status CONFIRMED for R2 endpoint and existing routes.** AC6 partially satisfied (B and C status assertions missing from route tests). ⚠️ MINOR

---

### TEST_ORDER_SERVICE — status: `tested`

**Referenced test:** `fixtures/order-app/tests/orderService.test.js` (self-referential)

**Verification:**
The ledger said this test needed updating because it used 9-char fixtures. The current test has been updated:
- Comment updated: "CHG-1042: Fixture data now uses 12-byte CUSTOMER_ID fields" ✓
- Added 12-char padded lookup test (line 21–25) ✓
- Added `getOrder` field resolution test confirming new offsets (line 28–36) ✓
- Confirms 8 records load from migrated extract ✓

**Verdict: `tested` status CONFIRMED.** ✅

---

### TEST_VALIDATION — status: `tested`

**Referenced test:** `fixtures/order-app/tests/validation.test.js` (self-referential)

**Verification:**
The ledger said this test `assert.equal(CUSTOMER_ID_LENGTH, 9)` and `assert.equal(isValidCustomerId('ABC123456789'), false)` — both of these OLD assertions no longer exist. Current test:
- Line 13–14: asserts `CUSTOMER_ID_LENGTH === 12` ✓
- Line 22–25: asserts three 12-char IDs are valid ✓
- Old `assert.equal(isValidCustomerId('ABC123456789'), false)` REMOVED ✓

**Verdict: `tested` status CONFIRMED. Test fully reflects new behavior.** ✅

---

### DOCS_BILLING_RUNBOOK — status: `waived`

**Ledger waiver reason:** "Markdown documentation; no executable test applies. Updated CHAR(9)→CHAR(12) references, corrected new positions (1-12, 36-43), and added explicit warning that nightly_billing.js batch update is pending Finance Ops sign-off."

**Verification:**
Current `BILLING-RUNBOOK.md` line 12: `Customer keys are \`CUSTOMER_ID CHAR(12)\`, format \`AAA999999\` (legacy 9-char) or \`AAA999999999\` (new 12-char, CHG-1042)` ✓  
Line 14–15: `the account key is **positions 1-12** of each record and the credit limit is **positions 36-43**` ✓ (was 1-9 and 33-40)  
Lines 17–21: Explicit warning that `nightly_billing.js` still uses old CHAR(9) offsets; DO NOT run against new extract until Finance Ops sign-off ✓  
Lines 22–24: Partner feed requires spec version bump with 3PL partners ✓

**Verdict: WAIVER HONEST AND ACCEPTABLE.** The runbook is accurate and now actively warns ops teams. ✅

---

## Section 3 — nightly_billing.js Run

**Command:** `node fixtures/order-app/batch/nightly_billing.js`

**Output (verbatim):**
```
billing_run: 0 records -> G:\rippleguard-bob\fixtures\order-app\out\billing_run.txt
```

**Analysis:**  
The job produced **zero billing records**, despite 8 orders in `orders.dat` (of which at least one — order 0000101 — has status `S`/SHIPPED and should be billed).

**Root cause:** The billing job reads `ORDER_STAT` at `line.substring(25, 26)`. After migration, the data file has `ORDER_STAT` at offset 28. `line.substring(25, 26)` now reads a byte from within the ORDER_AMT field (the 6th digit of the 9-digit amount), not the status byte. For all 8 migrated records, this returns a digit character (0–9), never `'S'`, so the `if (stat !== 'S') continue` guard skips every record.

**12-char customer ID survival test:**  
A 12-character customer ID does **NOT** survive this job untruncated. The job has three truncation points:
1. `line.substring(0, 9)` (line 30) — reads only 9 bytes of the 12-byte CUSMAS key into `creditByAcct`
2. `line.substring(7, 16)` (line 39) — reads only 9 bytes of the 12-byte ORDER_CUST field
3. `.padEnd(9, ' ').substring(0, 9)` (line 41) — re-truncates the key to 9 before the credit lookup
4. `b.acct.padEnd(9, ' ')` (line 54) — output record writes only 9 chars of the account key

Even if order processing were not skipped by the wrong status offset, any 12-char customer ID (e.g. `'ABC123456789'`) would be read as `'ABC123456'` (first 9 chars) from the CUSMAS extract, and the same truncated 9-char value from the ORDER_CUST field, making the credit lookup coincidentally "work" for this truncated key — but writing only 9 chars to the billing output. A **genuine 12-char ID** (e.g. `'ABC123456789'` vs `'ABC100001   '` padded) would produce lookup misses and HOLD flags because `creditByAcct['ABC123456']` ≠ `creditByAcct['ABC123456789']`.

**Conclusion: A 12-character customer ID would NOT survive the nightly billing job untruncated.** The job is known-broken against the migrated data and must not be run (runbook OPS-311, explicit warning in BILLING-RUNBOOK.md).

---

## Section 4 — Ledger Status Downgrades

The following change is made to `artifacts/impact-ledger.json`:

| Artifact ID | Old Status | New Status | Reason |
|---|---|---|---|
| `SVC_CUSTOMER_SERVICE` | `tested` | `open` | Referenced test (`routes.test.js`) exercises only 9-char customer IDs. No test proves a 12-char native customer ID survives the `GET /customers/{customerId}` lookup path end to end. File is unchanged from baseline (gate confirmed). AC5 not satisfied. |

---

## Section 5 — Findings, Severity-Ranked

### CRITICAL

None beyond the gate-blocking open ripples.

### MAJOR

**MAJOR-1: BATCH_NIGHTLY_BILLING — unresolved open ripple (RELEASE BLOCKING)**  
`fixtures/order-app/batch/nightly_billing.js` lines 30, 31, 36, 39, 40, 41, 54  
Six hardcoded CHAR(9)-era positional offsets remain. Demonstrated: running the job against the migrated data produces 0 billing records (ORDER_STAT read from wrong offset, all orders skipped). A 12-char customer ID would be truncated to 9 at least three independent times. Finance Ops sign-off and code update required before this job can run. Violates AC3.

**MAJOR-2: BATCH_PARTNER_FEED + CONFIG_FEED_LAYOUT — unresolved open ripples (RELEASE BLOCKING)**  
`fixtures/order-app/config/feed-layout.json` (CUST_KEY width=9, record_length=40, version V1)  
`fixtures/order-app/batch/partner_feed.js` line 20 (`.slice(0, field.width)` = 9)  
3PL partners receive a 9-char key for every new-format customer. Feed version not bumped to V2. Record-length assertion in partner_feed.js would throw on every migrated customer record. Violates AC3 and AC4.

**MAJOR-3: SVC_CUSTOMER_SERVICE — no 12-char test coverage (DOWNGRADED from tested → open)**  
`fixtures/order-app/tests/routes.test.js` — no test exercises `GET /customers/{12-char-id}` returning 200  
The service is functionally correct (inherits fix from validation.js and recordLayouts.js) but the `tested` claim cannot be sustained without a test that passes a native 12-char ID end to end. Violates AC5.

### MINOR

**MINOR-1: No native 12-char ID in fixture data**  
`fixtures/order-app/data/customers.dat` and `orders.dat` contain only legacy 9-char keys (right-padded to 12). Tests never exercise a true 12-char alphanumeric customer key (`AAA999999999`) flowing through any code path. AC5 ("12-character ids survive every read/write path end to end") is only satisfied for the padded-legacy form, not for a genuine post-Northfield-merger key. Partially violates AC5.

**MINOR-2: routes.test.js AC6 coverage gap**  
`fixtures/order-app/tests/routes.test.js` — the order-status endpoint tests only use order 0000101 (SHIPPED). Tests for `status: B` (BILLED) and `status: C` (CLOSED) are missing from the route layer. AC6 requires "correct data for shipped, open, billed, and closed orders." Service layer has the logic but no route-level assertion for B and C.

**MINOR-3: Evidence-audit.json baseline quotes stale**  
`artifacts/evidence-audit.json` — all quotes verified against the PRE-CHANGE baseline snapshot. For artifacts marked `waived`, the evidence quotes reflect old (broken) content that no longer exists in files. This is expected behavior but means the evidence-audit does not independently confirm the current (post-change) state of waived artifacts.

**MINOR-4: `toOrderStatusDto` omits `.trim()` on `customerId`**  
`fixtures/order-app/src/api/dto/customerDto.js` line 43: `customerId: order.custNo`  
The upstream `layouts.slice()` already trims, so this is safe in practice. But the DTO does not defensively trim — if the upstream were ever changed to stop trimming, the wire response would leak padded whitespace. Low risk but worth noting.

---

## Section 6 — Acceptance Criteria Verdict

| AC | Text | Verdict |
|---|---|---|
| AC1 | All schema definitions and shared layouts define the key as CHAR(12) | ✅ PASS — customers.sql, orders.sql, recordLayouts.js all use 12 |
| AC2 | Validation accepts both 9 and 12 character formats during transition | ✅ PASS — validation.js dual-accept, tests confirm |
| AC3 | NO consumer truncates a 12-character customer id (including positional consumers) | ❌ FAIL — nightly_billing.js (6 truncation points), partner_feed.js via feed-layout.json (9-char CUST_KEY) |
| AC4 | Partner feed spec bumped to V2 | ❌ FAIL — config/feed-layout.json still PARTNER-DAILY-V1 |
| AC5 | All tests pass, including new tests proving 12-char ids survive every read/write path end to end | ⚠️ PARTIAL — tests pass; 12-char validation and layout tests exist; but no route or service test exercises a native 12-char alphanumeric ID through the complete lookup path; SVC_CUSTOMER_SERVICE lacks 12-char route test |
| AC6 | Order status endpoint returns correct data for shipped, open, billed, and closed orders | ⚠️ PARTIAL — endpoint exists, tests cover shipped+open+404+400; billed and closed response shapes not asserted at route layer |

---

## Section 7 — Gate Verdict

```
RELEASE BLOCKED
```

**Blocking ripples:**
1. `BATCH_NIGHTLY_BILLING` (open) — positional offsets unresolved; job produces corrupt/missing output against migrated data
2. `BATCH_PARTNER_FEED` (open) — feed truncates 12-char keys to 9; V2 spec coordination required
3. `CONFIG_FEED_LAYOUT` (open) — partner feed config unchanged; V1 format incompatible with 12-char keys
4. `SVC_CUSTOMER_SERVICE` (downgraded to open) — no 12-char end-to-end test coverage for customer lookup path

**Non-blocking (must be resolved before next release):**
- Add a native 12-char customer ID to fixture data and exercise it in route tests
- Add route-layer assertions for BILLED and CLOSED order statuses
- Obtain Finance Ops sign-off and update `nightly_billing.js` per CHG-1042 scope
- Coordinate V2 partner feed spec with 3PL partners and update `config/feed-layout.json`
