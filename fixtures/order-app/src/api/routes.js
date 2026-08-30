/**
 * OrderCore REST routes.
 *
 *   GET /customers/{customerId}           lookup by CUSTOMER_ID
 *   GET /customers/{customerId}/orders
 *   GET /orders/{orderNo}
 *   GET /orders/{orderNo}/status          R2 — CHG-1042 new endpoint
 */
'use strict';

const { findCustomer } = require('../customer/customerService');
const { ordersForCustomer, getOrder } = require('../orders/orderService');
const { isValidCustomerId, isValidOrderNo } = require('../common/validation');
const { toCustomerDto, toOrderDto, toOrderStatusDto } = require('./dto/customerDto');

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body, null, 2));
}

function handle(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const parts = url.pathname.split('/').filter(Boolean);

  if (req.method !== 'GET') {
    return json(res, 405, { error: 'method not allowed' });
  }

  // GET /customers/{customerId}
  if (parts[0] === 'customers' && parts.length === 2) {
    const id = parts[1];
    if (!isValidCustomerId(id)) {
      return json(res, 400, { error: 'invalid customer id format' });
    }
    const customer = findCustomer(id);
    if (!customer) return json(res, 404, { error: 'customer not found' });
    return json(res, 200, toCustomerDto(customer));
  }

  // GET /customers/{customerId}/orders
  if (parts[0] === 'customers' && parts.length === 3 && parts[2] === 'orders') {
    const id = parts[1];
    if (!isValidCustomerId(id)) {
      return json(res, 400, { error: 'invalid customer id format' });
    }
    return json(res, 200, ordersForCustomer(id).map(toOrderDto));
  }

  // GET /orders/{orderNo}/status  (R2 — CHG-1042)
  if (parts[0] === 'orders' && parts.length === 3 && parts[2] === 'status') {
    const orderNo = parts[1];
    if (!isValidOrderNo(orderNo)) {
      return json(res, 400, { error: 'invalid order number' });
    }
    const order = getOrder(orderNo);
    if (!order) return json(res, 404, { error: 'order not found' });
    return json(res, 200, toOrderStatusDto(order));
  }

  // GET /orders/{orderNo}
  if (parts[0] === 'orders' && parts.length === 2) {
    const orderNo = parts[1];
    if (!isValidOrderNo(orderNo)) {
      return json(res, 400, { error: 'invalid order number' });
    }
    const order = getOrder(orderNo);
    if (!order) return json(res, 404, { error: 'order not found' });
    return json(res, 200, toOrderDto(order));
  }

  return json(res, 404, { error: 'not found' });
}

module.exports = { handle };
