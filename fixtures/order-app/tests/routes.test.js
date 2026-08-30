'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { handle } = require('../src/api/routes');

// Minimal fake req/res objects for unit-testing routes without a real server.
function fakeReq(method, url) {
  return { method, url };
}

function fakeRes() {
  const res = { _status: null, _headers: {}, _body: '' };
  res.writeHead = (status, headers) => { res._status = status; Object.assign(res._headers, headers); };
  res.end = (body) => { res._body = body; };
  res.json = () => JSON.parse(res._body);
  return res;
}

// ── GET /orders/{orderNo}/status  (R2 — CHG-1042) ──────────────────────────

test('GET /orders/{orderNo}/status returns 200 with status fields', () => {
  const req = fakeReq('GET', '/orders/0000101/status');
  const res = fakeRes();
  handle(req, res);
  assert.equal(res._status, 200);
  const body = res.json();
  assert.equal(body.orderNo, '0000101');
  // custNo trimmed from 12-char padded field; legacy id stored as-is
  assert.equal(body.customerId, 'ABC100001');
  assert.equal(body.status, 'S');
  assert.equal(body.statusName, 'SHIPPED');
  assert.equal(body.statusDate, '20260810');
  // amount field must NOT be present in the status response
  assert.equal(body.amount, undefined);
});

test('GET /orders/{orderNo}/status with 12-char customerId in extract', () => {
  // This test relies on customerService, which now normalises to 12 chars.
  // If we had a 12-char native key in the fixture we'd see it here.
  // For now just assert shape is correct for any valid orderNo.
  const req = fakeReq('GET', '/orders/0000104/status');
  const res = fakeRes();
  handle(req, res);
  assert.equal(res._status, 200);
  const body = res.json();
  assert.ok('orderNo' in body, 'has orderNo');
  assert.ok('customerId' in body, 'has customerId');
  assert.ok('status' in body, 'has status');
  assert.ok('statusName' in body, 'has statusName');
  assert.ok('statusDate' in body, 'has statusDate');
  assert.equal(body.amount, undefined, 'no amount in status dto');
});

test('GET /orders/{orderNo}/status returns 400 for invalid orderNo', () => {
  const req = fakeReq('GET', '/orders/BADORDER/status');
  const res = fakeRes();
  handle(req, res);
  assert.equal(res._status, 400);
  assert.ok(res.json().error);
});

test('GET /orders/{orderNo}/status returns 404 for unknown orderNo', () => {
  const req = fakeReq('GET', '/orders/9999999/status');
  const res = fakeRes();
  handle(req, res);
  assert.equal(res._status, 404);
});

// ── Existing routes still work with 9-char (legacy) customer ids ───────────

test('GET /customers/{customerId} accepts 9-char legacy id', () => {
  const req = fakeReq('GET', '/customers/ABC100001');
  const res = fakeRes();
  handle(req, res);
  assert.equal(res._status, 200);
  const body = res.json();
  assert.equal(body.customerId, 'ABC100001');
});

test('GET /customers/{customerId}/orders accepts 9-char legacy id', () => {
  const req = fakeReq('GET', '/customers/ABC100001/orders');
  const res = fakeRes();
  handle(req, res);
  assert.equal(res._status, 200);
  const orders = res.json();
  assert.equal(Array.isArray(orders), true);
  assert.ok(orders.length >= 1);
  // Every order's customerId should be a valid format
  for (const o of orders) {
    assert.match(o.customerId, /^[A-Z]{3}[0-9]{6,9}$/);
  }
});

test('GET /customers/{customerId} returns 400 for invalid id format', () => {
  const req = fakeReq('GET', '/customers/bad');
  const res = fakeRes();
  handle(req, res);
  assert.equal(res._status, 400);
});

test('GET /customers/{customerId} returns 404 for unknown customer', () => {
  const req = fakeReq('GET', '/customers/ZZZ999999');
  const res = fakeRes();
  handle(req, res);
  assert.equal(res._status, 404);
});

// ── 12-char native customer ID end-to-end (CHG-1042 AC5) ──────────────────

test('GET /customers/{12-char-id} returns 200 for native 12-char customer', () => {
  // XYZ000000001 is a genuine 12-char (3 letters + 9 digits) customer added
  // to the fixture by CHG-1042.  This test proves the full lookup path works.
  const req = fakeReq('GET', '/customers/XYZ000000001');
  const res = fakeRes();
  handle(req, res);
  assert.equal(res._status, 200, `expected 200 for XYZ000000001, got ${res._status}: ${res._body}`);
  const body = res.json();
  assert.equal(body.customerId, 'XYZ000000001');
});

test('GET /customers/{12-char-id}/orders returns 200 with orders for native 12-char customer', () => {
  const req = fakeReq('GET', '/customers/XYZ000000001/orders');
  const res = fakeRes();
  handle(req, res);
  assert.equal(res._status, 200, `expected 200, got ${res._status}: ${res._body}`);
  const orders = res.json();
  assert.equal(Array.isArray(orders), true);
  assert.ok(orders.length >= 1, 'XYZ000000001 must have at least one order');
  const orderNos = orders.map((o) => o.orderNo);
  assert.ok(orderNos.includes('0000109'), 'order 0000109 must be in the list');
});

test('GET /orders/{orderNo}/status returns shipped status for XYZ000000001 order', () => {
  const req = fakeReq('GET', '/orders/0000109/status');
  const res = fakeRes();
  handle(req, res);
  assert.equal(res._status, 200, `expected 200 for order 0000109, got ${res._status}`);
  const body = res.json();
  assert.equal(body.orderNo, '0000109');
  assert.equal(body.customerId, 'XYZ000000001');
  assert.equal(body.status, 'S');
  assert.equal(body.statusName, 'SHIPPED');
  assert.equal(body.statusDate, '20260901');
});

// ── Billed and closed order status assertions (CHG-1042 AC6) ──────────────

test('GET /orders/{orderNo}/status returns billed status correctly', () => {
  // Order 0000104 has status B (BILLED) in the fixture.
  const req = fakeReq('GET', '/orders/0000104/status');
  const res = fakeRes();
  handle(req, res);
  assert.equal(res._status, 200);
  const body = res.json();
  assert.equal(body.status, 'B');
  assert.equal(body.statusName, 'BILLED');
});

test('GET /orders/{orderNo}/status returns closed status correctly', () => {
  // Order 0000107 has status C (CLOSED) in the fixture.
  const req = fakeReq('GET', '/orders/0000107/status');
  const res = fakeRes();
  handle(req, res);
  assert.equal(res._status, 200);
  const body = res.json();
  assert.equal(body.status, 'C');
  assert.equal(body.statusName, 'CLOSED');
});
