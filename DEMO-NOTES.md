# How to read this repository in five minutes

**What RippleGuard is.** A release gate for legacy change. A developer drops
a change ticket (PDF); IBM Bob maps every artifact the change touches into
an evidence-linked impact ledger, implements the change strictly inside
that blast radius, and an independent Bob verifier audits the result. A
deterministic script — not the AI — decides whether the release ships.

**How the ledger and the gate interact.** `artifacts/impact-ledger.json` is
the single source of truth: every impacted artifact with file/line/quote
evidence, a risk rating, and a status (`open → changed → tested`, or
`waived` with a logged reason). `scripts/ripple-gate.js` refuses to approve
the release while any ripple is unproven: it re-hashes files against the
pre-change baseline to catch unearned "tested" claims, runs the full test
suite, verifies waivers carry reasons, and emits the Impact Certificate.
`scripts/verify-evidence.js` additionally proves every quoted line of
evidence exists verbatim in the source — AI citations, mechanically
audited.

**Where each IBM Bob 2.0 capability is used (evidence in `bob_sessions/`):**

| Capability | Where |
|---|---|
| Document understanding | Bob reads `tickets/CHG-1042-...pdf` directly |
| Parallel explore subagents | Five domain scouts (`.bob/agents/`) fan out during analyze |
| Skills | Three-phase workflow in `.bob/skills/rippleguard-*` |
| Agent mode | Scoped implementation, ledger statuses advanced only with passing tests |
| Independent verification | Read-only verifier re-derives the blast radius, may only downgrade statuses — it caught the implementer claiming "tested" on an unchanged file |

**Try it (Node 18+, no dependencies):** `npm test`, then `npm run ui` and
click **Run release gate** — it executes the real gate and shows the
verdict. Select any node and "Simulate open" to watch the release block.

**Why it matters.** Before the batch job was fixed, the nightly billing run
against migrated data completed "successfully" with zero records billed —
a silent production outage. The gate was the only thing standing between
that change and shipping. Grep found 12 of 15 impacted artifacts; Bob's
analysis found all 15, including a consumer whose source never mentions the
field's name.
