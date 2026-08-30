#!/usr/bin/env node
/**
 * Produce a clean copy of the repo for IBM Bob — fixture, skills,
 * ticket, and gate only. Open the EXPORTED folder in Bob IDE.
 *
 * Usage: node scripts/export-for-bob.js [dest]   (default ../rippleguard-bob)
 *
 * Whitelist approach: only what Bob needs is copied.
 * After Bob's tasks, copy back into this repo:
 *   - artifacts/impact-ledger.json and artifacts/verify-report.md
 *   - every file Bob changed under fixtures/order-app/
 *   - your exported session reports into bob_sessions/
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DEST = path.resolve(ROOT, process.argv[2] || path.join('..', 'rippleguard-bob'));

// Directories copied recursively (minus exclusions below)
const INCLUDE_DIRS = ['fixtures', '.bob', 'bob_sessions'];
// Individual files Bob's workflow needs
const INCLUDE_FILES = [
  'package.json',
  '.gitignore',
  'tickets/CHG-1042-customer-id-expansion.md',
  'tickets/CHG-1042-customer-id-expansion.pdf',
  'artifacts/impact-ledger.schema.json',
  'artifacts/baseline-manifest.json',
  'scripts/ripple-gate.js',
  'scripts/verify-evidence.js',
  'scripts/snapshot-baseline.js',
  'scripts/serve.js',
  'ui/index.html',
];
const EXCLUDE_DIR_NAMES = new Set(['out', 'node_modules', '.git']);

if (fs.existsSync(DEST) && fs.readdirSync(DEST).length > 0) {
  console.error(`destination not empty: ${DEST}\nDelete it first or pass another path.`);
  process.exit(1);
}

let count = 0;
function copyFile(rel) {
  const src = path.join(ROOT, rel);
  if (!fs.existsSync(src)) {
    console.warn(`  skip (missing): ${rel}`);
    return;
  }
  const dest = path.join(DEST, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  count++;
}

function copyDir(relDir) {
  const abs = path.join(ROOT, relDir);
  if (!fs.existsSync(abs)) return;
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const relChild = path.join(relDir, entry.name);
    if (entry.isDirectory()) {
      if (!EXCLUDE_DIR_NAMES.has(entry.name)) copyDir(relChild);
    } else {
      copyFile(relChild);
    }
  }
}

for (const d of INCLUDE_DIRS) copyDir(d);
for (const f of INCLUDE_FILES) copyFile(f);

// The export omits some tooling, so drop npm scripts that would dangle
// (they also name excluded files, and the workspace should be self-coherent).
const pkgPath = path.join(DEST, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
for (const dead of ['gate:example', 'tickets', 'grep-baseline']) {
  delete pkg.scripts[dead];
}
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

console.log(`exported ${count} files -> ${DEST}`);
console.log('');
console.log('Omitted: docs, README, example ledgers, UI state, certificate.');
console.log('');
console.log(`Open ${DEST} in Bob IDE. Prompts are in docs/BOB-RUNBOOK.md.`);
