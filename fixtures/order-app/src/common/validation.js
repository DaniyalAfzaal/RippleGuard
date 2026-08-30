/**
 * Shared input validation for OrderCore.
 * CHG-1042: CUSTOMER_ID expanded from CHAR(9) to CHAR(12).
 *           Both 9-char legacy (AAA999999) and 12-char new (AAA999999999)
 *           ids are accepted during the transition period.
 */
'use strict';

// CUSMAS key width — CHG-1042: widened from 9 to 12.
const CUSTOMER_ID_LENGTH = 12;

// Format: 3 alpha + 6 digits (legacy) OR 3 alpha + 9 digits (new)
const CUSTOMER_ID_PATTERN = /^[A-Z]{3}[0-9]{6}([0-9]{3})?$/;

function isValidCustomerId(id) {
  return (
    typeof id === 'string' &&
    (id.length === 9 || id.length === 12) &&
    CUSTOMER_ID_PATTERN.test(id)
  );
}

function assertValidCustomerId(id) {
  if (!isValidCustomerId(id)) {
    throw new Error(`Invalid customer id: "${id}"`);
  }
  return id;
}

const ORDER_NO_PATTERN = /^[0-9]{7}$/;

function isValidOrderNo(orderNo) {
  return typeof orderNo === 'string' && ORDER_NO_PATTERN.test(orderNo);
}

module.exports = {
  CUSTOMER_ID_LENGTH,
  CUSTOMER_ID_PATTERN,
  isValidCustomerId,
  assertValidCustomerId,
  isValidOrderNo,
};
