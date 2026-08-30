/**
 * OrderCore record layouts (the "copybook").
 *
 * These widths mirror the CUSMAS and ORDMAS physical files on the old
 * IBM i system this app was ported from in 1998. Flat data files in
 * data/ still use these exact positions.
 *
 * WARNING: some batch jobs predate this module and duplicate these
 * offsets as literal numbers. See docs/ops/BILLING-RUNBOOK.md.
 *
 * CHG-1042: CUSTOMER_ID widened from 9 → 12.  All field offsets that
 * follow the key shift by +3.  Record lengths: CUST_RECLEN 40→43,
 * ORDER_RECLEN 34→37.
 */
'use strict';

// CUSMAS customer record (record length 43)
const CUSTOMER_ID = Object.freeze({ start: 0, len: 12, pad: ' ' }); // key: AAA999999 or AAA999999999
const CUST_NAME = Object.freeze({ start: 12, len: 20, pad: ' ' });
const CUST_REGION = Object.freeze({ start: 32, len: 3, pad: ' ' });
const CUST_CREDIT = Object.freeze({ start: 35, len: 8, pad: '0' }); // 2 implied decimals
const CUST_RECLEN = 43;

// ORDMAS order record (record length 37)
const ORDER_NO = Object.freeze({ start: 0, len: 7, pad: '0' });
const ORDER_CUST = Object.freeze({ start: 7, len: 12, pad: ' ' }); // same width as CUSTOMER_ID
const ORDER_AMT = Object.freeze({ start: 19, len: 9, pad: '0' }); // 2 implied decimals
const ORDER_STAT = Object.freeze({ start: 28, len: 1, pad: ' ' }); // O/S/B/C
const ORDER_DATE = Object.freeze({ start: 29, len: 8, pad: ' ' }); // YYYYMMDD
const ORDER_RECLEN = 37;

/** Read one field out of a fixed-width record line. */
function slice(line, field) {
  return line.substring(field.start, field.start + field.len).trim();
}

/**
 * Format a value into a fixed-width field.
 * NOTE: silently truncates values longer than the field width,
 * exactly like the MOVE opcode did on the old system.
 */
function put(value, field) {
  const s = String(value == null ? '' : value);
  if (field.pad === '0') {
    return s.padStart(field.len, '0').slice(-field.len);
  }
  return s.padEnd(field.len, field.pad).slice(0, field.len);
}

module.exports = {
  CUSTOMER_ID,
  CUST_NAME,
  CUST_REGION,
  CUST_CREDIT,
  CUST_RECLEN,
  ORDER_NO,
  ORDER_CUST,
  ORDER_AMT,
  ORDER_STAT,
  ORDER_DATE,
  ORDER_RECLEN,
  slice,
  put,
};
