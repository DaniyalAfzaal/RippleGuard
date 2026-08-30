#!/usr/bin/env node
/**
 * The "what a careful developer with grep would find" baseline.
 * Literal, case-sensitive search for the grep term over the fixture,
 * scored against docs/ground-truth.json.
 *
 * Usage: node scripts/baseline-grep.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FIXTURE = path.join(ROOT, 'fixtures', 'order-app');
const TRUTH = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'docs', 'ground-truth.json'), 'utf8')
);
const OUT = path.join(ROOT, 'artifacts', 'baseline-grep.json');
const SKIP_DIRS = new Set(['out', 'node_modules']);
const TERM = TRUTH.grep_term;

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(path.join(dir, entry.name), files);
    } else {
      files.push(path.join(dir, entry.name));
    }
  }
  return files;
}

const hits = [];
for (const file of walk(FIXTURE).sort()) {
  const rel = path.relative(ROOT, file).split(path.sep).join('/');
  const text = fs.readFileSync(file, 'utf8');
  if (text.includes(TERM)) {
    const line = text.split(/\r?\n/).findIndex((l) => l.includes(TERM)) + 1;
    hits.push({ path: rel, first_line: line });
  }
}

const truthPaths = new Set(TRUTH.artifacts.map((a) => a.path));
const hitPaths = new Set(hits.map((h) => h.path));

const found = TRUTH.artifacts.filter((a) => hitPaths.has(a.path));
const missed = TRUTH.artifacts.filter((a) => !hitPaths.has(a.path));
const falsePositives = hits.filter((h) => !truthPaths.has(h.path));

const result = {
  term: TERM,
  generated: new Date().toISOString(),
  total_impacted: TRUTH.artifacts.length,
  grep_found: found.length,
  recall: +(found.length / TRUTH.artifacts.length).toFixed(3),
  found: found.map((a) => a.path),
  missed: missed.map((a) => ({ path: a.path, trap: a.trap })),
  false_positives: falsePositives.map((h) => h.path),
  raw_hits: hits,
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(result, null, 2));

console.log(`grep baseline for literal "${TERM}"`);
console.log(
  `  found ${found.length}/${TRUTH.artifacts.length} impacted artifacts (recall ${(result.recall * 100).toFixed(0)}%)`
);
console.log('  missed:');
for (const m of result.missed) console.log(`    - ${m.path}  [${m.trap}]`);
if (falsePositives.length) {
  console.log('  false positives:');
  for (const f of result.false_positives) console.log(`    - ${f}`);
}
console.log(`  -> ${path.relative(ROOT, OUT)}`);
