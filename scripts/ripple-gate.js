#!/usr/bin/env node
/**
 * RippleGuard release gate (deterministic, zero AI tokens).
 *
 * Refuses to ship until every artifact in the impact ledger is proven
 * resolved (tested) or explicitly waived with a reason. Also verifies,
 * against the baseline hash manifest, that artifacts claimed as changed
 * actually changed, and runs the fixture test suite.
 *
 * Usage:
 *   node scripts/ripple-gate.js                  # gate artifacts/impact-ledger.json
 *   node scripts/ripple-gate.js --ledger <path>  # gate another ledger
 *   node scripts/ripple-gate.js --strict         # hash mismatches become failures
 *   node scripts/ripple-gate.js --skip-tests     # skip the test run
 *
 * Exit code 0 = SHIP, 1 = BLOCKED.
 */
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const ARGS = process.argv.slice(2);

function arg(flag, fallback) {
  const i = ARGS.indexOf(flag);
  return i >= 0 && ARGS[i + 1] ? ARGS[i + 1] : fallback;
}
const LEDGER_PATH = path.resolve(ROOT, arg('--ledger', 'artifacts/impact-ledger.json'));
const STRICT = ARGS.includes('--strict');
const SKIP_TESTS = ARGS.includes('--skip-tests');

const VALID_STATUS = new Set(['open', 'changed', 'tested', 'waived']);
const RESOLVED = new Set(['tested', 'waived']);

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function sha256File(p) {
  return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
}

// ---------------------------------------------------------------- load
if (!fs.existsSync(LEDGER_PATH)) {
  console.error(`${RED}GATE ERROR${RESET}: ledger not found: ${LEDGER_PATH}`);
  console.error('Run the rippleguard-analyze skill in Bob first, or pass --ledger.');
  process.exit(1);
}
const ledger = readJson(LEDGER_PATH);
const ledgerRel = path.relative(ROOT, LEDGER_PATH).split(path.sep).join('/');
const isExample = /example/i.test(ledgerRel);

const failures = [];
const warnings = [];

// ------------------------------------------------------ structure check
if (!ledger.ticket_id) failures.push('ledger missing ticket_id');
if (!Array.isArray(ledger.artifacts) || ledger.artifacts.length === 0) {
  failures.push('ledger has no artifacts');
}

for (const a of ledger.artifacts || []) {
  const label = a.id || a.path || '(unnamed)';
  if (!a.path) failures.push(`${label}: missing path`);
  if (!a.why) failures.push(`${label}: missing why`);
  if (!VALID_STATUS.has(a.status)) {
    failures.push(`${label}: invalid status "${a.status}" (open|changed|tested|waived)`);
  }
  if (!Array.isArray(a.evidence) || a.evidence.length === 0) {
    warnings.push(`${label}: no evidence entries`);
  }
  if (a.status === 'waived' && !a.waiver_reason) {
    failures.push(`${label}: waived without waiver_reason`);
  }
  if (a.status === 'tested') {
    if (!a.test) {
      failures.push(`${label}: status tested but no test reference`);
    } else if (!fs.existsSync(path.resolve(ROOT, a.test))) {
      failures.push(`${label}: referenced test does not exist: ${a.test}`);
    }
  }
  if (a.path && !fs.existsSync(path.resolve(ROOT, a.path))) {
    failures.push(`${label}: artifact path does not exist: ${a.path}`);
  }
}

// -------------------------------------------------- unresolved artifacts
const unresolved = (ledger.artifacts || []).filter((a) => !RESOLVED.has(a.status));
for (const a of unresolved) {
  failures.push(
    `UNRESOLVED RIPPLE: ${a.id || a.path} is "${a.status}" — ${a.why}`
  );
}

// ------------------------------------------------------ baseline hashes
const manifestPath = path.join(ROOT, 'artifacts', 'baseline-manifest.json');
let baseline = null;
if (fs.existsSync(manifestPath)) {
  baseline = readJson(manifestPath);
  for (const a of ledger.artifacts || []) {
    if (!a.path || !fs.existsSync(path.resolve(ROOT, a.path))) continue;
    const before = baseline.files[a.path];
    if (before === undefined) continue; // outside the snapshot (e.g. new file)
    const now = sha256File(path.resolve(ROOT, a.path));
    const changed = now !== before;
    if ((a.status === 'changed' || a.status === 'tested') && !changed) {
      const msg = `${a.id || a.path}: status "${a.status}" but file is identical to the pre-change baseline`;
      if (STRICT) failures.push(msg);
      else warnings.push(msg + ' (use --strict to enforce)');
    }
  }
} else {
  warnings.push('no baseline manifest (run scripts/snapshot-baseline.js before changes)');
}

// -------------------------------------------------------------- tests
let testResult = { ran: false, passed: null, output: '' };
if (!SKIP_TESTS) {
  const r = spawnSync(
    process.execPath,
    ['--test', '--test-reporter=tap', 'fixtures/order-app/tests/*.test.js'],
    {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 120000,
  });
  const output = (r.stdout || '') + (r.stderr || '');
  const passMatch = output.match(/^#? ?(?:pass|ℹ pass) (\d+)/m) || output.match(/# pass (\d+)/);
  const failMatch = output.match(/^#? ?(?:fail|ℹ fail) (\d+)/m) || output.match(/# fail (\d+)/);
  testResult = {
    ran: true,
    passed: r.status === 0,
    pass_count: passMatch ? Number(passMatch[1]) : null,
    fail_count: failMatch ? Number(failMatch[1]) : null,
    output: output.split(/\r?\n/).slice(-25).join('\n'),
  };
  if (r.status !== 0) {
    failures.push(
      `test suite failing (${testResult.fail_count ?? '?'} failing tests)`
    );
  }
}

// ------------------------------------------------------ recall metrics
let recall = null;
const truthPath = path.join(ROOT, 'docs', 'ground-truth.json');
if (fs.existsSync(truthPath)) {
  const truth = readJson(truthPath);
  const truthPaths = new Set(truth.artifacts.map((t) => t.path));
  const ledgerPaths = new Set((ledger.artifacts || []).map((a) => a.path));
  const found = [...truthPaths].filter((p) => ledgerPaths.has(p));
  const missed = [...truthPaths].filter((p) => !ledgerPaths.has(p));
  recall = {
    total_impacted: truthPaths.size,
    ledger_found: found.length,
    recall: +(found.length / truthPaths.size).toFixed(3),
    missed,
  };
  if (missed.length > 0) {
    for (const m of missed) {
      warnings.push(`ledger does not cover known-impacted artifact: ${m}`);
    }
  }
}

let grepBaseline = null;
const grepPath = path.join(ROOT, 'artifacts', 'baseline-grep.json');
if (fs.existsSync(grepPath)) grepBaseline = readJson(grepPath);

let evidenceAudit = null;
const auditPath = path.join(ROOT, 'artifacts', 'evidence-audit.json');
if (fs.existsSync(auditPath)) {
  const audit = readJson(auditPath);
  if (audit.ledger === ledgerRel) {
    evidenceAudit = {
      total_quotes: audit.total_quotes,
      verified: audit.verified,
      mismatches: audit.mismatches,
      audited_at: audit.audited_at,
      ledger: audit.ledger,
    };
  } else {
    warnings.push(
      `evidence audit on file is for "${audit.ledger}", not this ledger — rerun node scripts/verify-evidence.js`
    );
  }
}

// ------------------------------------------------------------- verdict
const decision = failures.length === 0 ? 'ship' : 'block';
const counts = { open: 0, changed: 0, tested: 0, waived: 0 };
for (const a of ledger.artifacts || []) {
  if (counts[a.status] !== undefined) counts[a.status]++;
}

const result = {
  ticket_id: ledger.ticket_id,
  change: ledger.change,
  ledger: ledgerRel,
  ledger_fingerprint: crypto
    .createHash('sha256')
    .update(fs.readFileSync(LEDGER_PATH))
    .digest('hex'),
  generated: new Date().toISOString(),
  decision,
  strict: STRICT,
  counts,
  failures,
  warnings,
  tests: testResult,
  recall,
  grep_baseline: grepBaseline
    ? { found: grepBaseline.grep_found, total: grepBaseline.total_impacted }
    : null,
  evidence_audit: evidenceAudit,
  is_example: isExample,
};

fs.mkdirSync(path.join(ROOT, 'artifacts'), { recursive: true });
fs.writeFileSync(
  path.join(ROOT, 'artifacts', 'gate-result.json'),
  JSON.stringify(result, null, 2)
);

// ------------------------------------------------------ ui/gate-state.js
const uiData = { ledger, gate: result };
fs.mkdirSync(path.join(ROOT, 'ui'), { recursive: true });
fs.writeFileSync(
  path.join(ROOT, 'ui', 'gate-state.js'),
  '// Generated by scripts/ripple-gate.js — do not edit by hand.\n' +
    'window.RIPPLE_DATA = ' +
    JSON.stringify(uiData, null, 2) +
    ';\n'
);
// Remove the legacy filename so stale state can never be served.
try { fs.rmSync(path.join(ROOT, 'ui', 'data.js')); } catch {}

// -------------------------------------------------------- certificate
const cert = buildCertificate(ledger, result);
fs.writeFileSync(path.join(ROOT, 'artifacts', 'certificate.html'), cert);

// -------------------------------------------------------------- report
const banner =
  decision === 'ship'
    ? `${GREEN}RELEASE APPROVED${RESET}`
    : `${RED}RELEASE BLOCKED${RESET}`;
console.log('');
console.log('================ RippleGuard Gate ================');
console.log(`Ticket:   ${ledger.ticket_id} — ${ledger.change || ''}`);
console.log(`Ledger:   ${ledgerRel}${isExample ? '  (EXAMPLE DATA)' : ''}`);
console.log(
  `Ripples:  ${ledger.artifacts.length} total | tested ${counts.tested} | waived ${counts.waived} | changed ${counts.changed} | open ${counts.open}`
);
if (recall) {
  console.log(
    `Recall:   ledger covers ${recall.ledger_found}/${recall.total_impacted} known-impacted artifacts` +
      (grepBaseline ? ` (grep baseline: ${grepBaseline.grep_found}/${grepBaseline.total_impacted})` : '')
  );
}
if (testResult.ran) {
  console.log(
    `Tests:    ${testResult.passed ? 'pass' : 'FAIL'} (${testResult.pass_count ?? '?'} passed, ${testResult.fail_count ?? '?'} failed)`
  );
}
if (evidenceAudit) {
  console.log(
    `Evidence: ${evidenceAudit.verified}/${evidenceAudit.total_quotes} quotes verified verbatim against source (audited ${evidenceAudit.audited_at})`
  );
}
if (warnings.length) {
  console.log(`${YELLOW}Warnings:${RESET}`);
  for (const w of warnings) console.log(`  ${YELLOW}-${RESET} ${w}`);
}
if (failures.length) {
  console.log(`${RED}Failures:${RESET}`);
  for (const f of failures) console.log(`  ${RED}-${RESET} ${f}`);
}
console.log('');
console.log(`  ${banner}`);
console.log('==================================================');
console.log('');
console.log('Wrote artifacts/gate-result.json, artifacts/certificate.html, ui/gate-state.js');

process.exit(decision === 'ship' ? 0 : 1);

// ---------------------------------------------------------------------
function buildCertificate(ledgerDoc, gate) {
  const ship = gate.decision === 'ship';
  const color = ship ? '#34d399' : '#fb7185';
  const tint = ship ? 'rgba(52,211,153,.12)' : 'rgba(251,113,133,.12)';
  const label = ship ? 'RELEASE APPROVED' : 'RELEASE BLOCKED';
  const rows = ledgerDoc.artifacts
    .map((a) => {
      const statusColor =
        { tested: '#24a148', waived: '#8d8d8d', changed: '#f1c21b', open: '#da1e28' }[
          a.status
        ] || '#4589ff';
      return `<tr>
        <td>${a.id || ''}</td>
        <td><code>${a.path}</code></td>
        <td>${a.risk || ''}</td>
        <td style="color:${statusColor};font-weight:600">${a.status.toUpperCase()}${
        a.status === 'waived' && a.waiver_reason ? ` — ${a.waiver_reason}` : ''
      }</td>
        <td>${a.test ? `<code>${a.test}</code>` : ''}</td>
      </tr>`;
    })
    .join('\n');

  return `<!doctype html>
<html><head><meta charset="utf-8"><title>RippleGuard Impact Certificate — ${ledgerDoc.ticket_id}</title>
<style>
  body{font-family:'IBM Plex Sans','Segoe UI',sans-serif;background:#0a0a0b;color:#ececee;margin:0;padding:40px}
  .card{max-width:960px;margin:0 auto;background:#141417;border:1px solid #27272c;border-radius:12px;padding:34px}
  h1{font-size:22px;margin:0 0 4px;letter-spacing:-.01em}
  h1 span{color:#22d3ee}
  .sub{color:#b4b4bc;margin-bottom:24px}
  .verdict{display:inline-block;padding:10px 24px;border-radius:999px;font-size:18px;font-weight:700;letter-spacing:.05em;background:${tint};color:${color};border:1px solid ${color};margin-bottom:24px}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th,td{border-bottom:1px solid #27272c;padding:8px 10px;text-align:left;vertical-align:top}
  th{color:#77777f;font-weight:600;text-transform:uppercase;font-size:10.5px;letter-spacing:.1em}
  code{color:#22d3ee;font-family:'IBM Plex Mono',Consolas,monospace;font-size:12px}
  .meta{margin-top:24px;color:#77777f;font-size:12px;line-height:1.7}
  .example{position:fixed;top:14px;right:-40px;transform:rotate(35deg);background:#fbbf24;color:#0a0a0b;font-weight:700;padding:4px 60px;font-size:12px}
</style></head><body>
${gate.is_example ? '<div class="example">EXAMPLE DATA</div>' : ''}
<div class="card">
  <h1>RippleGuard Impact Certificate</h1>
  <div class="sub">${ledgerDoc.ticket_id} — ${ledgerDoc.change || ''}</div>
  <div class="verdict">${label}</div>
  <div>Ripples: ${ledgerDoc.artifacts.length} total —
    tested ${gate.counts.tested}, waived ${gate.counts.waived},
    changed ${gate.counts.changed}, open ${gate.counts.open}</div>
  ${
    gate.recall
      ? `<div style="margin-top:6px">Coverage: ${gate.recall.ledger_found}/${gate.recall.total_impacted} known-impacted artifacts${
          gate.grep_baseline
            ? ` &nbsp;|&nbsp; grep baseline found ${gate.grep_baseline.found}/${gate.grep_baseline.total}`
            : ''
        }</div>`
      : ''
  }
  ${
    gate.tests && gate.tests.ran
      ? `<div style="margin-top:6px">Tests: ${gate.tests.passed ? 'PASS' : 'FAIL'} (${gate.tests.pass_count ?? '?'} passed, ${gate.tests.fail_count ?? '?'} failed)</div>`
      : ''
  }
  ${
    gate.evidence_audit
      ? `<div style="margin-top:6px">Evidence audit: ${gate.evidence_audit.verified}/${gate.evidence_audit.total_quotes} quoted source lines verified verbatim</div>`
      : ''
  }
  <h2 style="font-size:15px;margin-top:28px">Ripple ledger</h2>
  <table>
    <tr><th>Id</th><th>Artifact</th><th>Risk</th><th>Status</th><th>Test</th></tr>
    ${rows}
  </table>
  ${
    gate.failures.length
      ? `<h2 style="font-size:15px;margin-top:24px;color:#da1e28">Blocking findings</h2><ul>${gate.failures
          .map((f) => `<li>${f}</li>`)
          .join('')}</ul>`
      : ''
  }
  <div class="meta">
    Generated ${gate.generated} · Gate ${gate.strict ? 'strict' : 'standard'} mode<br>
    Ledger fingerprint (SHA-256): <code>${gate.ledger_fingerprint}</code><br>
    Produced by the RippleGuard deterministic gate. Impact analysis, implementation,
    and verification performed with IBM Bob (see bob_sessions/).
  </div>
</div>
</body></html>`;
}
