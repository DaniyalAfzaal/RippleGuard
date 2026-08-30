'use strict';

const test = require('node:test');
const assert = require('node:assert');
const {
  isValidCustomerId,
  CUSTOMER_ID_LENGTH,
} = require('../src/common/validation');

// CHG-1042: CUSTOMER_ID now accepts both 9-char (AAA999999) and 12-char
// (AAA999999999) formats. CUSTOMER_ID_LENGTH reflects the new max width (12).

test('CUSTOMER_ID_LENGTH is now 12 (CHG-1042)', () => {
  assert.equal(CUSTOMER_ID_LENGTH, 12);
});

test('CUSTOMER_ID accepts legacy 9-char format (AAA999999)', () => {
  assert.equal(isValidCustomerId('ABC123456'), true);
  assert.equal(isValidCustomerId('ZZZ000001'), true);
});

test('CUSTOMER_ID accepts new 12-char format (AAA999999999)', () => {
  assert.equal(isValidCustomerId('ABC123456789'), true);
  assert.equal(isValidCustomerId('ZZZ000000001'), true);
  assert.equal(isValidCustomerId('DEF200004000'), true);
});

test('CUSTOMER_ID rejects wrong lengths (not 9 or 12)', () => {
  assert.equal(isValidCustomerId('ABC12345'), false);    // 8
  assert.equal(isValidCustomerId('ABC1234567'), false);  // 10
  assert.equal(isValidCustomerId('ABC12345678'), false); // 11
  assert.equal(isValidCustomerId('ABC1234567890'), false); // 13
});

test('CUSTOMER_ID rejects malformed ids', () => {
  assert.equal(isValidCustomerId('abc123456'), false);      // lowercase
  assert.equal(isValidCustomerId('123456789'), false);      // no alpha prefix
  assert.equal(isValidCustomerId(''), false);
  assert.equal(isValidCustomerId(null), false);
  assert.equal(isValidCustomerId('ABC12345 ABCD'), false);  // spaces
});
