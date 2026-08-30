/**
 * Order master access. Reads the ORDMAS flat extract in data/.
 * CHG-1042: Removed drift-copy CUSID_LEN; key width now sourced from
 *           recordLayouts.ORDER_CUST.len (matches CUSTOMER_ID.len).
 */
'use strict';

const fs = require('fs');
const path = require('path');
const layouts = require('../common/recordLayouts');

const DATA_FILE = path.join(__dirname, '..', '..', 'data', 'orders.dat');

const STATUS_NAMES = {
  O: 'OPEN',
  S: 'SHIPPED',
  B: 'BILLED',
  C: 'CLOSED',
};

function loadOrders() {
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  return raw
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) => ({
      orderNo: layouts.slice(line, layouts.ORDER_NO),
      custNo: layouts.slice(line, layouts.ORDER_CUST),
      amount: Number(layouts.slice(line, layouts.ORDER_AMT)) / 100,
      status: layouts.slice(line, layouts.ORDER_STAT),
      statusName: STATUS_NAMES[layouts.slice(line, layouts.ORDER_STAT)] || 'UNKNOWN',
      statusDate: layouts.slice(line, layouts.ORDER_DATE),
    }));
}

function ordersForCustomer(custNo) {
  // Pad/trim the incoming key to the ORDER_CUST field width before matching.
  const keyWidth = layouts.ORDER_CUST.len;
  const key = String(custNo).padEnd(keyWidth, ' ').slice(0, keyWidth).trim();
  return loadOrders().filter((o) => o.custNo === key);
}

function getOrder(orderNo) {
  return loadOrders().find((o) => o.orderNo === String(orderNo)) || null;
}

module.exports = { loadOrders, ordersForCustomer, getOrder };
