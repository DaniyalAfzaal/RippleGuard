#!/usr/bin/env node
/**
 * NIGHTLY_BILLING — ported from NIGHTBILL.CLLE + BILL0400.RPG (1998).
 *
 * Reads the ORDMAS and CUSMAS extracts and produces the billing work
 * file consumed by finance. Runs in the 02:00 batch window.
 *
 * CHG-1042 (Finance Ops sign-off 2026-08-29): All positional offsets
 * are now derived from src/common/recordLayouts.js.  The hardcoded
 * CHAR(9) constants have been removed.  A record-length guard rejects
 * any line that does not match CUST_RECLEN or ORDER_RECLEN.
 *
 * Do not modify without ops sign-off. See docs/ops/BILLING-RUNBOOK.md.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const layouts = require('../src/common/recordLayouts');

const DATA_DIR = path.join(__dirname, '..', 'data');
const OUT_DIR = path.join(__dirname, '..', 'out');

function readLines(file) {
  return fs
    .readFileSync(path.join(DATA_DIR, file), 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0);
}

function run() {
  // Credit limits by account key.
  // Key: CUSTOMER_ID field from CUSMAS extract, width sourced from recordLayouts.
  const creditByAcct = {};
  for (const line of readLines('customers.dat')) {
    if (line.length !== layouts.CUST_RECLEN) {
      throw new Error(
        `CUSMAS record length ${line.length} != expected ${layouts.CUST_RECLEN} — extract may not be migrated`
      );
    }
    const acct = layouts.slice(line, layouts.CUSTOMER_ID);
    creditByAcct[acct] = Number(layouts.slice(line, layouts.CUST_CREDIT)) / 100;
  }

  const billed = [];
  for (const line of readLines('orders.dat')) {
    if (line.length !== layouts.ORDER_RECLEN) {
      throw new Error(
        `ORDMAS record length ${line.length} != expected ${layouts.ORDER_RECLEN} — extract may not be migrated`
      );
    }
    const stat = layouts.slice(line, layouts.ORDER_STAT);
    if (stat !== 'S') continue; // bill shipped orders only

    const acct = layouts.slice(line, layouts.ORDER_CUST); // 12-char key, never truncated
    const amt = Number(layouts.slice(line, layouts.ORDER_AMT)) / 100;
    const credit = creditByAcct[acct];

    billed.push({
      acct,
      amount: amt,
      overCredit: credit !== undefined ? amt > credit : true,
    });
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const outFile = path.join(OUT_DIR, 'billing_run.txt');
  const keyWidth = layouts.CUSTOMER_ID.len; // 12
  const lines = billed.map(
    (b) =>
      `${b.acct.padEnd(keyWidth, ' ')}|${String(b.amount.toFixed(2)).padStart(12, ' ')}|${
        b.overCredit ? 'HOLD' : 'OK  '
      }`
  );
  fs.writeFileSync(outFile, lines.join('\n') + '\n');
  console.log(`billing_run: ${billed.length} records -> ${outFile}`);
  for (const l of lines) console.log('  ' + l);
}

run();
