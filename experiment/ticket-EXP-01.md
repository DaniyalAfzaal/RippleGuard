# Change Request EXP-01 — Customer Key Expansion (Experiment)

| Field | Value |
|---|---|
| Ticket | EXP-01 |
| Priority | High |
| System | Customer Master (CUSMAS) |
| Requested by | Enterprise Architecture |

## Background

The customer key `CUSID` is a CHAR(9) value in the format `AAA999999`
(3 alpha characters + 6 digits). The id space is nearly exhausted.

## Requirement

Expand the customer key from **CHAR(9) to CHAR(12)**, new format
`AAA999999999` (3 alpha + 9 digits). Every program, file definition,
copybook, query, and batch job that reads, writes, validates, or slices
the customer key must be identified and updated.

## Acceptance criteria

1. All file definitions and copybooks define the key as CHAR(12).
2. All validation logic accepts the 12-character format.
3. No program or batch job truncates a 12-character key.
4. All positional/substring access to the key is corrected, including
   downstream fields whose offsets shift.
