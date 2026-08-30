/**
 * Customer master access. Reads the CUSMAS flat extract in data/.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const layouts = require('../common/recordLayouts');
const { assertValidCustomerId } = require('../common/validation');

const DATA_FILE = path.join(__dirname, '..', '..', 'data', 'customers.dat');

function loadCustomers() {
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  return raw
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) => ({
      id: layouts.slice(line, layouts.CUSTOMER_ID),
      name: layouts.slice(line, layouts.CUST_NAME),
      region: layouts.slice(line, layouts.CUST_REGION),
      creditLimit: Number(layouts.slice(line, layouts.CUST_CREDIT)) / 100,
    }));
}

function findCustomer(customerId) {
  assertValidCustomerId(customerId);
  // Normalize to the CUSTOMER_ID field width before matching the extract.
  const key = layouts.put(customerId, layouts.CUSTOMER_ID);
  return loadCustomers().find(
    (c) => layouts.put(c.id, layouts.CUSTOMER_ID) === key
  ) || null;
}

module.exports = { loadCustomers, findCustomer };
