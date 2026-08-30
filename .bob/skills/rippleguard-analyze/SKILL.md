---
name: rippleguard-analyze
description: Turn a change-request document (PDF) into an evidence-linked impact ledger by fanning out parallel read-only explore subagents across database, code, batch, API, test, and docs domains. Use when the user provides a change ticket and asks for impact or blast-radius analysis.
---

# RippleGuard: Analyze

You are performing impact analysis, not implementation. You MUST NOT modify
any file except `artifacts/impact-ledger.json`.

## Step 1 — Understand the ticket

Read the change-request document the user attached (for example
`@/tickets/CHG-1042-customer-id-expansion.pdf`). Extract:

- ticket id and one-line change summary
- every requirement (R1, R2, ...)
- every acceptance criterion
- constraints (ownership, sign-offs, batch windows)

## Step 2 — Fan out parallel explore subagents

Spawn parallel **explore** subagents, one per domain. Personas for each are
defined in `.bob/agents/`:

| Subagent | Persona | Searches |
|---|---|---|
| database | `data-explorer` | `db/`, `data/`, layouts, SQL, DDL, views |
| code | `code-explorer` | `src/`, shared modules, duplicated width/length constants, aliases |
| batch | `batch-explorer` | `batch/`, `config/`, positional offset arithmetic, ops docs |
| api | `api-explorer` | DTOs, routes, wire contracts, maxLength/pattern pins |
| test | `test-explorer` | `tests/`, format/length assertions, fixture assumptions |

Each subagent must return findings as a list of:
`{ path, line, exact quoted source line, why it is affected, risk }`.

Critical instruction to pass to every subagent: the change may be referenced
by ALIAS (CUSID, CUST_KEY, custNo, acct) or by RAW POSITION (substring,
offsets, widths) with no name at all. Searching for the field name alone is
insufficient. Consumers may also be INDIRECT: a module containing no width
literals whatsoever that imports the shared layout or validation modules and
handles the field through them is still in the blast radius — trace the
importers of every shared module you identify. Also read operational
documentation under `docs/` — it often names hand-maintained consumers that
code search cannot find.

## Step 3 — Merge into the impact ledger

Deduplicate and merge all findings. Write `artifacts/impact-ledger.json`
conforming to `artifacts/impact-ledger.schema.json`:

- one entry per impacted artifact with `id`, `path`, `why`, `evidence`
  (file + line + quote), `risk`, `domain`
- every entry starts with `"status": "open"`
- set `generated_by` to this task's name

Do not guess. Every entry needs at least one exact quoted line of evidence.

Evidence quote fidelity is checked MECHANICALLY (`scripts/verify-evidence.js`
compares each quote character-for-character against the cited line). Each
quote must therefore be exactly ONE physical source line, copied verbatim
from the cited line number. Never join wrapped lines, never paraphrase, and
never merge a multi-line statement — if a statement spans lines, quote the
single most probative line and cite that line's number.

## Step 4 — Report

Print a summary table (id, path, risk, why) and state how many artifacts are
in the blast radius. Recommend running `node scripts/ripple-gate.js` to see
the release gate verdict (it will block — nothing is resolved yet).
