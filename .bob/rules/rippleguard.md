# RippleGuard project rules

- The impact ledger (`artifacts/impact-ledger.json`) is the single source of
  truth for change scope. Never edit files outside the ledger's blast radius
  without saying so explicitly.
- Write durable outputs to files (ledger, reports), not just chat messages.
  Follow-up tasks must be able to work from files alone.
- Keep tasks small and focused: one phase (analyze / implement / verify) per
  task. Do not combine phases in a single conversation.
- Prefer read-only explore subagents for discovery; use edit tools only when
  implementing authorized changes.
- Never modify `scripts/ripple-gate.js` or anything in `bob_sessions/`.
- Report the gate verdict verbatim. If the gate blocks, the release is
  blocked — do not soften it.
- Never place credentials, API keys, or tokens in any file in this
  repository.
