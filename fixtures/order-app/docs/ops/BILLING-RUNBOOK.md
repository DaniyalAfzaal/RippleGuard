# Nightly Billing Runbook (Finance Ops)

Owner: Finance Ops. Application changes to billing require ops sign-off.

## Job chain (02:00 window)

1. `batch/nightly_billing.js` — billing extractor
2. `batch/partner_feed.js` — partner customer feed (after billing)

## Data contracts

- Customer keys are `CUSTOMER_ID CHAR(12)`, format `AAA999999` (legacy 9-char)
  or `AAA999999999` (new 12-char, CHG-1042). Both formats are accepted.
- **CHG-1042 (Finance Ops sign-off 2026-08-29):** The billing extractor now
  derives all field positions from `src/common/recordLayouts.js`.
  The account key is read from `CUSTOMER_ID` (start=0, len=12) and the credit
  limit from `CUST_CREDIT` (start=35, len=8).  Hardcoded CHAR(9) offsets have
  been removed.  A record-length guard (CUST_RECLEN=43, ORDER_RECLEN=37) rejects
  any unmigrated extract at startup with a clear error message.
- **CHG-1042 (3PL coordination confirmed 2026-08-29):** The partner feed has
  been bumped to spec version `PARTNER-DAILY-V2` (record_length=43, CUST_KEY
  width=12).  `config/feed-layout.json` and `batch/partner_feed.js` have been
  updated.  The old CHAR(9) truncation has been replaced with an explicit guard
  that throws if any value would exceed its field width.

## Failure handling

- `HOLD` lines in `out/billing_run.txt` mean the order amount exceeds
  the customer's credit limit; finance reviews these manually.
- If the CUSMAS or ORDMAS extracts are the wrong record length (e.g. an
  unmigrated 40/34-byte file), the billing job throws immediately with a
  descriptive error message rather than silently processing corrupt data.
  (Resolves known debt OPS-311.)
