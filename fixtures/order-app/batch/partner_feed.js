#!/usr/bin/env node
/**
 * PARTNER_FEED — daily fixed-width customer feed for 3PL partners.
 * CUSTOMER_ID goes out as CUST_KEY per the partner spec in
 * config/feed-layout.json. Runs after nightly billing.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { loadCustomers } = require('../src/customer/customerService');

const CONFIG = path.join(__dirname, '..', 'config', 'feed-layout.json');
const OUT_DIR = path.join(__dirname, '..', 'out');

function pad(value, field) {
  const s = String(value == null ? '' : value);
  if (s.length > field.width) {
    throw new Error(
      `${field.name} value "${s}" (length ${s.length}) exceeds field width ${field.width} — would truncate`
    );
  }
  const padChar = field.pad || ' ';
  if (padChar === '0') return s.padStart(field.width, '0').slice(-field.width);
  return s.padEnd(field.width, padChar);
}

function run() {
  const layout = JSON.parse(fs.readFileSync(CONFIG, 'utf8'));
  const byName = Object.fromEntries(layout.fields.map((f) => [f.name, f]));

  const records = loadCustomers().map((c) => {
    let rec = '';
    rec += pad(c.id, byName.CUST_KEY);
    rec += pad(c.name, byName.CUST_NAME);
    rec += pad(c.region, byName.CUST_REGION);
    rec += pad(Math.round(c.creditLimit * 100), byName.CREDIT_LIMIT);
    if (rec.length !== layout.record_length) {
      throw new Error(
        `record length ${rec.length} != spec ${layout.record_length}`
      );
    }
    return rec;
  });

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const outFile = path.join(OUT_DIR, 'partner_feed.txt');
  fs.writeFileSync(outFile, records.join('\n') + '\n');
  console.log(`partner_feed: ${records.length} records -> ${outFile}`);
}

run();
