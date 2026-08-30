# Change Request CHG-1042

## Customer ID Expansion and Order Status API

| Field | Value |
|---|---|
| Ticket | CHG-1042 |
| Priority | High |
| System | OrderCore (customer master + order master) |
| Requested by | Enterprise Architecture |
| Target release | 2026.9 |

## Background

OrderCore customer keys (CUSTOMER_ID) are CHAR(9), format AAA999999
(3 alpha + 6 digits). Following the Northfield Distribution merger the
combined customer base exhausts the 6-digit space in Q4 2026.

## Requirement R1 — expand CUSTOMER_ID to CHAR(12)

New format: AAA999999999 (3 alpha + 9 digits, length 12).

Scope: every artifact that stores, validates, formats, slices, or
transmits the customer key must be identified and updated. This
includes, at minimum: database schemas and views, shared record
layouts, service logic, API contracts, batch jobs, partner feed
specifications, operational documentation, and tests.

Transition rule: during the transition, ids of BOTH formats are valid
input (AAA999999 and AAA999999999). Stored fixed-width records use the
new 12-character field width; legacy 9-character ids are right-padded
with spaces. Downstream field offsets shift accordingly.

Data extracts in data/ must be migrated to the new record widths. A
one-time migration script (fixtures/order-app/scripts/) is in scope;
production data migration will be executed by ops at release using it.

## Requirement R2 — order status API

Add endpoint: GET /orders/{orderNo}/status

Response body (JSON):
{ "orderNo": string, "customerId": string, "status": string,
  "statusName": string, "statusDate": string (YYYYMMDD) }

Errors: 400 invalid order number, 404 unknown order.

## Acceptance criteria

1. All schema definitions and shared layouts define the key as CHAR(12).
2. Validation accepts both 9 and 12 character formats during transition.
3. NO consumer truncates a 12-character customer id. This includes
   positional/offset-based consumers.
4. The partner feed spec is bumped to version V2 with the widened key
   and updated record length.
5. All tests pass, including new tests proving 12-character ids survive
   every read/write path end to end.
6. The order status endpoint returns correct data for shipped, open,
   billed, and closed orders.

## Constraints

- The nightly billing window (02:00) is unchanged.
- Changes to batch jobs require Finance Ops sign-off
  (see docs/ops/BILLING-RUNBOOK.md).
- No new runtime dependencies.
