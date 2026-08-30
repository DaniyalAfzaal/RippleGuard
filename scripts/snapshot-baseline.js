#!/usr/bin/env node
/**
 * Records a SHA-256 manifest of the pre-change fixture state.
 * The ripple gate compares current file hashes against this manifest
 * to prove which artifacts actually changed (no git required).
 *
 * Usage: node scripts/snapshot-baseline.js
 */
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FIXTURE = path.join(ROOT, 'fixtures', 'order-app');
const OUT = path.join(ROOT, 'artifacts', 'baseline-manifest.json');
const SKIP_DIRS = new Set(['out', 'node_modules']);

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

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

const manifest = {
  created: new Date().toISOString(),
  root: 'fixtures/order-app',
  files: {},
};

for (const file of walk(FIXTURE).sort()) {
  const rel = path.relative(ROOT, file).split(path.sep).join('/');
  manifest.files[rel] = sha256(file);
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(manifest, null, 2));
console.log(
  `baseline: ${Object.keys(manifest.files).length} files hashed -> ${path.relative(ROOT, OUT)}`
);
