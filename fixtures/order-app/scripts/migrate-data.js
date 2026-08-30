#!/usr/bin/env node
/**
 * CHG-1042 data extract migration script.
 *
 * Widens CUSTOMER_ID from CHAR(9) to CHAR(12) in both fixed-width flat files:
 *   data/customers.dat  40-byte records → 43-byte records
 *   data/orders.dat     34-byte records → 37-byte records
 *
 * The migration is idempotent: if the records are already 43/37 bytes long
 * the script exits with a warning and makes no changes.
 *
 * Usage:
 *   node fixtures/order-app/scripts/migrate-data.js            # dry run
 *   node fixtures/order-app/scripts/migrate-data.js --apply    # write files
 *
 * CUSMAS layout (old → new)
 *   [0..8]    CUSTOMER_ID  CHAR(9)  → [0..11]   CUSTOMER_ID  CHAR(12)
 *   [9..28]   CUST_NAME    CHAR(20) → [12..31]  CUST_NAME    CHAR(20)
 *   [29..31]  CUST_REGION  CHAR(3)  → [32..34]  CUST_REGION  CHAR(3)
 *   [32..39]  CUST_CREDIT  CHAR(8)  → [35..42]  CUST_CREDIT  CHAR(8)
 *
 * ORDMAS layout (old → new)
 *   [0..6]    ORDER_NO     CHAR(7)  → [0..6]    ORDER_NO     CHAR(7)   (unchanged)
 *   [7..15]   ORDER_CUST   CHAR(9)  → [7..18]   ORDER_CUST   CHAR(12)
 *   [16..24]  ORDER_AMT    CHAR(9)  → [19..27]  ORDER_AMT    CHAR(9)
 *   [25]      ORDER_STAT   CHAR(1)  → [28]      ORDER_STAT   CHAR(1)
 *   [26..33]  ORDER_DATE   CHAR(8)  → [29..36]  ORDER_DATE   CHAR(8)
 */
'use strict';

const fs = require('fs');
const path = require('path');

const APPLY = process.argv.includes('--apply');
const DATA_DIR = path.join(__dirname, '..', 'data');
const CUST_FILE = path.join(DATA_DIR, 'customers.dat');
const ORD_FILE = path.join(DATA_DIR, 'orders.dat');

const OLD_CUST_LEN = 40;
const NEW_CUST_LEN = 43;
const OLD_ORD_LEN = 34;
const NEW_ORD_LEN = 37;

function readLines(file) {
  return fs.readFileSync(file, 'utf8').split(/\r?\n/).filter((l) => l.length > 0);
}

function padRight(s, len) {
  return s.padEnd(len, ' ').slice(0, len);
}

function migrateCustLine(line) {
  if (line.length !== OLD_CUST_LEN) {
    throw new Error(`customers.dat: unexpected record length ${line.length} (expected ${OLD_CUST_LEN})`);
  }
  const custId   = line.substring(0, 9);   // CUSTOMER_ID old CHAR(9)
  const custName = line.substring(9, 29);  // CUST_NAME   CHAR(20)
  const region   = line.substring(29, 32); // CUST_REGION CHAR(3)
  const credit   = line.substring(32, 40); // CUST_CREDIT CHAR(8)
  return padRight(custId, 12) + custName + region + credit;
}

function migrateOrdLine(line) {
  if (line.length !== OLD_ORD_LEN) {
    throw new Error(`orders.dat: unexpected record length ${line.length} (expected ${OLD_ORD_LEN})`);
  }
  const orderNo  = line.substring(0, 7);   // ORDER_NO   CHAR(7)
  const custId   = line.substring(7, 16);  // ORDER_CUST old CHAR(9)
  const orderAmt = line.substring(16, 25); // ORDER_AMT  CHAR(9)
  const stat     = line.substring(25, 26); // ORDER_STAT CHAR(1)
  const date     = line.substring(26, 34); // ORDER_DATE CHAR(8)
  return orderNo + padRight(custId, 12) + orderAmt + stat + date;
}

function run() {
  // ----- customers.dat -----
  const custLines = readLines(CUST_FILE);
  const firstCustLen = custLines[0] ? custLines[0].length : 0;

  if (firstCustLen === NEW_CUST_LEN) {
    console.log(`customers.dat: already ${NEW_CUST_LEN}-byte records — no migration needed.`);
  } else if (firstCustLen === OLD_CUST_LEN) {
    const migrated = custLines.map(migrateCustLine);
    if (APPLY) {
      fs.writeFileSync(CUST_FILE, migrated.join('\n') + '\n', 'utf8');
      console.log(`customers.dat: migrated ${migrated.length} records (${OLD_CUST_LEN}→${NEW_CUST_LEN} bytes).`);
    } else {
      console.log(`customers.dat: DRY RUN — would migrate ${migrated.length} records (${OLD_CUST_LEN}→${NEW_CUST_LEN} bytes).`);
      migrated.slice(0, 3).forEach((l) => console.log('  sample:', l));
    }
  } else {
    throw new Error(`customers.dat: unrecognised record length ${firstCustLen} (expected ${OLD_CUST_LEN} or ${NEW_CUST_LEN})`);
  }

  // ----- orders.dat -----
  const ordLines = readLines(ORD_FILE);
  const firstOrdLen = ordLines[0] ? ordLines[0].length : 0;

  if (firstOrdLen === NEW_ORD_LEN) {
    console.log(`orders.dat: already ${NEW_ORD_LEN}-byte records — no migration needed.`);
  } else if (firstOrdLen === OLD_ORD_LEN) {
    const migrated = ordLines.map(migrateOrdLine);
    if (APPLY) {
      fs.writeFileSync(ORD_FILE, migrated.join('\n') + '\n', 'utf8');
      console.log(`orders.dat: migrated ${migrated.length} records (${OLD_ORD_LEN}→${NEW_ORD_LEN} bytes).`);
    } else {
      console.log(`orders.dat: DRY RUN — would migrate ${migrated.length} records (${OLD_ORD_LEN}→${NEW_ORD_LEN} bytes).`);
      migrated.slice(0, 3).forEach((l) => console.log('  sample:', l));
    }
  } else {
    throw new Error(`orders.dat: unrecognised record length ${firstOrdLen} (expected ${OLD_ORD_LEN} or ${NEW_ORD_LEN})`);
  }

  if (!APPLY) {
    console.log('\nRe-run with --apply to write the changes.');
  }
}

run();
