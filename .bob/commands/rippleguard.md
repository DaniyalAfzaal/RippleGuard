Run the RippleGuard pipeline for the change ticket the user names (default:
tickets/CHG-1042-customer-id-expansion.pdf).

Phases — each phase is its own focused unit of work; confirm with the user
before moving to the next phase:

1. ANALYZE — activate the `rippleguard-analyze` skill: read the ticket PDF,
   fan out parallel explore subagents, write artifacts/impact-ledger.json
   with every entry status "open".
2. IMPLEMENT — activate the `rippleguard-implement` skill with the scope the
   user authorizes, advancing ledger statuses open -> changed -> tested.
3. VERIFY — activate the `rippleguard-verify` skill: independent, read-only
   audit; downgrade unproven statuses; write artifacts/verify-report.md.
4. GATE — run `node scripts/ripple-gate.js --strict` and report the verdict
   exactly as printed. Never claim SHIP when the gate says BLOCKED.
