'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { ordersForCustomer, getOrder, loadOrders } = require('../src/orders/orderService');

// CHG-1042: Fixture data now uses 12-byte CUSTOMER_ID fields.
// Legacy 9-char keys (e.g. 'ABC100001') are right-padded to CHAR(12)
// in data/orders.dat; ordersForCustomer normalises the lookup key to
// the same width, so both the short and padded forms must match.

test('ordersForCustomer finds orders by legacy 9-char key', () => {
  const orders = ordersForCustomer('ABC100001');
  assert.equal(orders.length, 2);
  assert.deepEqual(
    orders.map((o) => o.orderNo).sort(),
    ['0000101', '0000102']
  );
});

test('ordersForCustomer finds orders by 12-char key (padded legacy)', () => {
  // The extract stores 'ABC100001   ' (right-padded to 12).
  // Passing the padded form explicitly should also resolve.
  const orders = ordersForCustomer('ABC100001   ');
  assert.equal(orders.length, 2);
});

test('getOrder resolves all status fields from 12-byte extract', () => {
  const order = getOrder('0000101');
  assert.ok(order);
  assert.equal(order.custNo, 'ABC100001');
  assert.equal(order.status, 'S');
  assert.equal(order.statusName, 'SHIPPED');
  assert.equal(order.statusDate, '20260810');
  assert.equal(order.amount, 125.0);
});

test('order extract parses all 9 records (includes CHG-1042 new-format customer)', () => {
  assert.equal(loadOrders().length, 9);
});

test('ordersForCustomer finds orders by native 12-char key XYZ000000001', () => {
  // XYZ000000001 is a genuine 12-char customer ID added by CHG-1042.
  // This proves a non-padded, non-legacy 12-char key resolves end to end.
  const orders = ordersForCustomer('XYZ000000001');
  assert.equal(orders.length, 1, 'XYZ000000001 must have exactly 1 order');
  assert.equal(orders[0].orderNo, '0000109');
  assert.equal(orders[0].custNo, 'XYZ000000001');
  assert.equal(orders[0].status, 'S');
  assert.equal(orders[0].amount, 345.0);
});
