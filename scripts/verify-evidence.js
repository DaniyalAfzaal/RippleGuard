#!/usr/bin/env node
/**
 * Evidence audit: mechanically verifies that every evidence quote in the
 * impact ledger matches the source line it cites. AI-generated analysis is
 * only trustworthy if its citations are real — this proves they are.
 *
 * Run immediately after the analyze phase (before implementation shifts
 * line numbers). The result is stored and surfaced by the gate and UI.
 *
 * Usage:
 *   node scripts/verify-evidence.js [--ledger <path>]
 *
 * Exit 0 = all quotes verified; exit 1 = mismatches found.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ARGS = process.argv.slice(2);
const i = ARGS.indexOf('--ledger');
const LEDGER_PATH = path.resolve(
  ROOT,
  i >= 0 && ARGS[i + 1] ? ARGS[i + 1] : 'artifacts/impact-ledger.json'
);

if (!fs.existsSync(LEDGER_PATH)) {
  console.error(`ledger not found: ${LEDGER_PATH}`);
  process.exit(1);
}
const ledger = JSON.parse(fs.readFileSync(LEDGER_PATH, 'utf8'));

const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim();

const results = [];
for (const a of ledger.artifacts || []) {
  for (const e of a.evidence || []) {
    const abs = path.resolve(ROOT, e.file);
    const entry = { artifact: a.id, file: e.file, line: e.line, quote: e.quote };
    if (!fs.existsSync(abs)) {
      entry.result = 'file_missing';
    } else {
      const lines = fs.readFileSync(abs, 'utf8').split(/\r?\n/);
      const cited = lines[e.line - 1];
      if (cited !== undefined && norm(cited) === norm(e.quote)) {
        entry.result = 'verified';
      } else if (cited !== undefined && norm(cited).includes(norm(e.quote))) {
        entry.result = 'verified';
      } else {
        // line numbers may have shifted; accept an exact-content match
        // anywhere in the file, recorded as such
        const found = lines.findIndex((l) => norm(l) === norm(e.quote));
        if (found >= 0) {
          entry.result = 'verified_moved';
          entry.found_line = found + 1;
        } else {
          entry.result = 'mismatch';
          entry.actual = cited === undefined ? '(line out of range)' : cited.trim();
        }
      }
    }
    results.push(entry);
  }
}

const counts = { verified: 0, verified_moved: 0, mismatch: 0, file_missing: 0 };
for (const r of results) counts[r.result]++;
const total = results.length;
const ok = counts.verified + counts.verified_moved;

const audit = {
  ledger: path.relative(ROOT, LEDGER_PATH).split(path.sep).join('/'),
  audited_at: new Date().toISOString(),
  total_quotes: total,
  verified: ok,
  exact: counts.verified,
  moved: counts.verified_moved,
  mismatches: counts.mismatch,
  missing_files: counts.file_missing,
  detail: results,
};

fs.mkdirSync(path.join(ROOT, 'artifacts'), { recursive: true });
fs.writeFileSync(
  path.join(ROOT, 'artifacts', 'evidence-audit.json'),
  JSON.stringify(audit, null, 2)
);

console.log('=========== RippleGuard Evidence Audit ===========');
console.log(`Ledger:  ${audit.ledger}`);
console.log(`Quotes:  ${total} cited | ${counts.verified} verified at cited line | ${counts.verified_moved} verified (line moved)`);
if (counts.mismatch || counts.file_missing) {
  console.log(`FAILED:  ${counts.mismatch} mismatched, ${counts.file_missing} missing files`);
  for (const r of results.filter((x) => x.result === 'mismatch' || x.result === 'file_missing')) {
    console.log(`  - ${r.artifact} ${r.file}:${r.line} [${r.result}]`);
    if (r.actual !== undefined) console.log(`      cited:  ${r.quote}\n      actual: ${r.actual}`);
  }
} else {
  console.log('RESULT:  every quoted line of evidence exists verbatim in the source.');
}
console.log('-> artifacts/evidence-audit.json');
console.log('==================================================');

process.exit(counts.mismatch + counts.file_missing > 0 ? 1 : 0);
